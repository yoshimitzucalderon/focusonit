/**
 * RLS Policy Security Test
 *
 * This script tests that Row Level Security policies correctly isolate user data.
 * It creates two test users and verifies that User A cannot access User B's data.
 *
 * CRITICAL: This test MUST pass before production launch.
 *
 * Usage:
 *   npx ts-node scripts/test-rls-policies.ts
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // ANON key respects RLS

interface TestResult {
  name: string
  passed: boolean
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM'
  message: string
}

const results: TestResult[] = []

function logTest(name: string, passed: boolean, severity: 'CRITICAL' | 'HIGH' | 'MEDIUM', message: string) {
  results.push({ name, passed, severity, message })
  const emoji = passed ? '✅' : '❌'
  const severityLabel = passed ? '' : `[${severity}]`
  console.log(`${emoji} ${severityLabel} ${name}`)
  if (!passed) {
    console.log(`   ${message}`)
  }
}

async function testRLS() {
  console.log('🔒 Starting RLS Policy Security Test...\n')
  console.log('This will create temporary test users and verify data isolation.\n')

  // Create two separate Supabase clients (one per test user)
  const supabase1 = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  const supabase2 = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  // Generate unique emails for test users
  const timestamp = Date.now()
  const user1Email = `rls_test_user1_${timestamp}@example.com`
  const user2Email = `rls_test_user2_${timestamp}@example.com`
  const password = 'SecureTestPassword123!'

  console.log('📝 Creating test users...')
  console.log(`   User 1: ${user1Email}`)
  console.log(`   User 2: ${user2Email}\n`)

  // ========================================
  // TEST 1: Create User 1
  // ========================================
  const { data: signupData1, error: signupError1 } = await supabase1.auth.signUp({
    email: user1Email,
    password,
  })

  if (signupError1 || !signupData1.user) {
    console.error('❌ Failed to create User 1:', signupError1?.message)
    process.exit(1)
  }

  const user1 = signupData1.user
  console.log(`✅ User 1 created (ID: ${user1.id})`)

  // ========================================
  // TEST 2: Create User 2
  // ========================================
  const { data: signupData2, error: signupError2 } = await supabase2.auth.signUp({
    email: user2Email,
    password,
  })

  if (signupError2 || !signupData2.user) {
    console.error('❌ Failed to create User 2:', signupError2?.message)
    process.exit(1)
  }

  const user2 = signupData2.user
  console.log(`✅ User 2 created (ID: ${user2.id})\n`)

  // ========================================
  // TEST 3: User 1 creates a task
  // ========================================
  console.log('📝 User 1 creating a task...')
  const { data: task, error: createError } = await supabase1
    .from('tasks')
    .insert({
      user_id: user1.id,
      title: 'RLS Test Task - CONFIDENTIAL',
      description: 'This task should ONLY be visible to User 1',
      due_date: '2025-11-20',
      google_calendar_sync: false,
    })
    .select()
    .single()

  if (createError || !task) {
    console.error('❌ User 1 failed to create task:', createError?.message)
    process.exit(1)
  }

  console.log(`✅ User 1 created task (ID: ${task.id})\n`)

  // ========================================
  // TEST 4: User 1 can read their own task (SHOULD PASS)
  // ========================================
  console.log('🔍 Testing User 1 can read own task...')
  const { data: user1ReadOwnTask, error: user1ReadError } = await supabase1
    .from('tasks')
    .select('*')
    .eq('id', task.id)
    .single()

  logTest(
    'User 1 can read own task',
    !!user1ReadOwnTask && !user1ReadError,
    'CRITICAL',
    'User cannot read their own data! RLS policy misconfigured.'
  )

  // ========================================
  // TEST 5: User 2 tries to read User 1's task (SHOULD FAIL)
  // ========================================
  console.log('🔍 Testing User 2 CANNOT read User 1 task...')
  const { data: user2ReadTask, error: user2ReadError } = await supabase2
    .from('tasks')
    .select('*')
    .eq('id', task.id)

  const user2CannotRead = !!( (!user2ReadTask || user2ReadTask.length === 0) || user2ReadError )

  logTest(
    'User 2 CANNOT read User 1 task',
    user2CannotRead,
    'CRITICAL',
    `SECURITY BREACH: User 2 can read User 1's confidential task! RLS SELECT policy is NOT working.`
  )

  // ========================================
  // TEST 6: User 2 tries to update User 1's task (SHOULD FAIL)
  // ========================================
  console.log('🔍 Testing User 2 CANNOT update User 1 task...')
  const { data: updatedTask, error: updateError } = await supabase2
    .from('tasks')
    .update({ title: 'HACKED BY USER 2!' })
    .eq('id', task.id)
    .select()

  const user2CannotUpdate = !!( (!updatedTask || updatedTask.length === 0) || updateError )

  logTest(
    'User 2 CANNOT update User 1 task',
    user2CannotUpdate,
    'CRITICAL',
    `SECURITY BREACH: User 2 can modify User 1's task! RLS UPDATE policy is NOT working.`
  )

  // ========================================
  // TEST 7: User 2 tries to delete User 1's task (SHOULD FAIL)
  // ========================================
  console.log('🔍 Testing User 2 CANNOT delete User 1 task...')
  const { error: deleteError, count: deleteCount } = await supabase2
    .from('tasks')
    .delete()
    .eq('id', task.id)

  const user2CannotDelete = !!( deleteError || deleteCount === 0 )

  logTest(
    'User 2 CANNOT delete User 1 task',
    user2CannotDelete,
    'CRITICAL',
    `SECURITY BREACH: User 2 can delete User 1's task! RLS DELETE policy is NOT working.`
  )

  // ========================================
  // TEST 8: Verify task still exists after failed delete
  // ========================================
  console.log('🔍 Verifying task still exists...')
  const { data: taskStillExists } = await supabase1
    .from('tasks')
    .select('id')
    .eq('id', task.id)
    .single()

  logTest(
    'Task still exists after unauthorized delete attempt',
    !!taskStillExists,
    'HIGH',
    'Task was deleted by unauthorized user!'
  )

  // ========================================
  // TEST 9: User 1 can update their own task (SHOULD PASS)
  // ========================================
  console.log('🔍 Testing User 1 can update own task...')
  const { data: user1UpdateOwnTask, error: user1UpdateError } = await supabase1
    .from('tasks')
    .update({ title: 'Updated by User 1' })
    .eq('id', task.id)
    .select()
    .single()

  logTest(
    'User 1 can update own task',
    !!user1UpdateOwnTask && !user1UpdateError,
    'HIGH',
    'User cannot update their own task! RLS policy misconfigured.'
  )

  // ========================================
  // TEST 10: User 1 can delete their own task (SHOULD PASS)
  // ========================================
  console.log('🔍 Testing User 1 can delete own task...')
  const { error: user1DeleteError } = await supabase1
    .from('tasks')
    .delete()
    .eq('id', task.id)

  logTest(
    'User 1 can delete own task',
    !user1DeleteError,
    'HIGH',
    'User cannot delete their own task! RLS policy misconfigured.'
  )

  // ========================================
  // Cleanup: Sign out test users
  // ========================================
  console.log('\n🧹 Cleaning up test users...')
  await supabase1.auth.signOut()
  await supabase2.auth.signOut()
  console.log('✅ Cleanup completed\n')

  // ========================================
  // SUMMARY
  // ========================================
  console.log('═'.repeat(60))
  console.log('📊 RLS SECURITY TEST SUMMARY')
  console.log('═'.repeat(60))

  const criticalFailures = results.filter(r => !r.passed && r.severity === 'CRITICAL')
  const highFailures = results.filter(r => !r.passed && r.severity === 'HIGH')
  const mediumFailures = results.filter(r => !r.passed && r.severity === 'MEDIUM')

  console.log(`\nTotal Tests: ${results.length}`)
  console.log(`Passed: ${results.filter(r => r.passed).length}`)
  console.log(`Failed: ${results.filter(r => !r.passed).length}`)

  if (criticalFailures.length > 0) {
    console.log(`\n🚨 CRITICAL FAILURES: ${criticalFailures.length}`)
    criticalFailures.forEach(f => {
      console.log(`   ❌ ${f.name}`)
      console.log(`      ${f.message}`)
    })
  }

  if (highFailures.length > 0) {
    console.log(`\n⚠️  HIGH SEVERITY FAILURES: ${highFailures.length}`)
    highFailures.forEach(f => {
      console.log(`   ❌ ${f.name}`)
    })
  }

  if (mediumFailures.length > 0) {
    console.log(`\n⚠️  MEDIUM SEVERITY FAILURES: ${mediumFailures.length}`)
    mediumFailures.forEach(f => {
      console.log(`   ❌ ${f.name}`)
    })
  }

  console.log('\n' + '═'.repeat(60))

  if (results.every(r => r.passed)) {
    console.log('✅ ALL RLS SECURITY TESTS PASSED')
    console.log('   Application is SAFE to launch.')
    console.log('   User data isolation is correctly enforced.')
    process.exit(0)
  } else {
    console.log('❌ RLS SECURITY TESTS FAILED')
    console.log('   DO NOT LAUNCH to production until fixed!')
    console.log('   Users can access each other\'s data!')
    process.exit(1)
  }
}

// Run tests
testRLS().catch(error => {
  console.error('💥 Test execution failed:', error)
  process.exit(1)
})
