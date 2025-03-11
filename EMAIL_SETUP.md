# Email Setup Guide

This guide explains how to set up the email functionality for your portfolio's contact form using EmailJS.

## Step 1: Create an EmailJS Account

1. Go to [EmailJS website](https://www.emailjs.com/) and sign up for a free account
2. Verify your account through the confirmation email

## Step 2: Connect an Email Service

1. In your EmailJS dashboard, click on "Email Services" in the left sidebar
2. Click "Add New Service"
3. Choose your preferred email provider (Gmail, Outlook, etc.)
4. Follow the instructions to connect your email account
5. Give your service a name (e.g., "portfolio-contact")
6. Note down the **Service ID** for later

## Step 3: Create an Email Template

1. In your EmailJS dashboard, click on "Email Templates" in the left sidebar
2. Click "Create New Template"
3. Design your email template with the following content:

**Subject:**

```
New Contact Form Submission from {{name}}
```

**Content:**

```
Name: {{name}}
Email: {{email}}

Message:
{{message}}
```

4. Save your template and note down the **Template ID**

## Step 4: Update Your Configuration File

1. Get your **Public Key** from the EmailJS dashboard under "Account" > "API Keys"
2. Copy `config.template.js` to `config.js` in your portfolio project
3. Open `config.js` and update the EmailJS configuration:
   ```javascript
   emailjs: {
     publicKey: "YOUR_ACTUAL_PUBLIC_KEY",
     serviceId: "YOUR_ACTUAL_SERVICE_ID",
     templateId: "YOUR_ACTUAL_TEMPLATE_ID"
   }
   ```
4. Make sure `config.js` is in your `.gitignore` file to prevent accidentally committing your keys

## Step 5: Test the Form

1. Open your portfolio website
2. Fill out the contact form with test data
3. Submit the form
4. Check your email to ensure you received the test message

## Security Note

Never commit your actual API keys to version control. The `config.js` file containing your real keys should always be excluded from Git using the `.gitignore` file. Only the template file without actual keys should be committed.
