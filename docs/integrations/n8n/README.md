# n8n Integration Files

This folder contains n8n workflow files and code snippets for the FocusOnIt voice-to-task integration.

## Files

- **n8n-workflow-voice-to-task.json** - Complete n8n workflow for converting voice messages to tasks
- **n8n-code-bulletproof.js** - Bulletproof parser code snippet for handling voice input
- **n8n-parse-json-improved.js** - Improved JSON parser code snippet with error handling

## Overview

The n8n integration allows users to create tasks by sending voice messages through messaging platforms. The workflow processes the voice input, transcribes it, and creates tasks in FocusOnIt.

## Setup

To use these workflows:

1. Import `n8n-workflow-voice-to-task.json` into your n8n instance
2. Configure the necessary credentials (API keys, webhook URLs)
3. Use the code snippets as needed in your workflow nodes

## Integration Flow

1. Receive voice message via webhook or messaging platform
2. Transcribe audio using speech-to-text service
3. Parse transcription to extract task details (title, description, date)
4. Create task in FocusOnIt via API
5. Send confirmation response to user

## References

- [n8n documentation](https://docs.n8n.io/)
- [FocusOnIt API documentation](../../technical/)
- Voice-to-task feature implementation details (coming soon)

## Notes

- The bulletproof parser includes robust error handling for malformed input
- The improved JSON parser handles edge cases in natural language processing
- Workflows can be customized for different messaging platforms
