<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Workspace invitation</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
    <p>You were invited to join <strong>{{ $workspaceName }}</strong> on SendIO.</p>
    <p>Your role will be <strong>{{ $role }}</strong>.</p>
    @if ($expiresAt)
        <p>This invitation expires on {{ $expiresAt->toDayDateTimeString() }}.</p>
    @endif
    <p>
        <a href="{{ $invitationUrl }}">Accept invitation</a>
    </p>
</body>
</html>
