@component('mail::message')
# You've been added to {{ $storeName }}

Hi {{ $name }},

{{ $storeName }} has invited you to join their {{ $roleName }} team on **{{ config('app.name') }}**. Your account has been created and is ready to sign in.

@component('mail::panel')
**Sign in credentials**

- **Email:** {{ $email }}
- **Temporary password:** `{{ $temporaryPassword }}`
@endcomponent

@component('mail::button', ['url' => $loginUrl, 'color' => 'success'])
Sign in to your account
@endcomponent

For security, please sign in and change your password after your first login. If you did not expect this email, you can safely ignore it.

Thanks,<br>
{{ config('app.name') }}
@endcomponent