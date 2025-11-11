# Integrations

This folder contains documentation for external service integrations with FocusOnIt.

## Available Integrations

### Google Calendar
Complete documentation for Google Calendar integration, including setup, OAuth configuration, and implementation details.

- [README](./google-calendar/README.md) - Overview and quick start
- [SETUP.md](./google-calendar/SETUP.md) - Self-hosted setup guide
- [IMPLEMENTATION.md](./google-calendar/IMPLEMENTATION.md) - Technical implementation details
- [YCM360.md](./google-calendar/YCM360.md) - YCM360 specific configuration

### n8n Workflows
Voice-to-task automation workflows and code snippets for n8n integration.

- [README](./n8n/README.md) - n8n integration overview
- Workflow files and code snippets for voice message processing

## Future Integrations

Planned integrations:
- Microsoft Outlook Calendar
- Apple Calendar (iCal)
- Slack notifications
- Discord bot
- Todoist sync

## Adding New Integrations

When adding a new integration:
1. Create a new folder under `docs/integrations/[service-name]/`
2. Add a README.md with overview and setup instructions
3. Include configuration files and code examples
4. Update this README with the new integration
