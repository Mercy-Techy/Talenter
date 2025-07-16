import * as sendgrid from '@sendgrid/mail';
import { UserDocument } from '../user/user.schema';
import { config } from 'dotenv';

config();

const passwordResetConfirmationTemplate = (
  user: UserDocument,
) => `<style type="text/css">
  body,
  html, 
  .body {
  background: #f3f3f3 !important;
  }

  .header {
  background: #f3f3f3;
  }
</style>

<spacer size="16"></spacer>

<container>

  <row class="header">
  <columns>

      <spacer size="16"></spacer>
      
      <h4 class="text-center">Hi ${user.firstName}</h4>
  </columns>
  </row>
  <row>
  <columns>

      <spacer size="32"></spacer>

      <center>
      </center>

      <spacer size="16"></spacer>

      <h1 class="text-center">Password Reset Confirmation</h1>
      
      <spacer size="16"></spacer>

      <p class="text-center">Your password has been successfully reset.
       You can now login with your new password.</p>

      <hr/>
      
      <p><small>You're getting this email because you've signed up for email
updates. If you want to opt-out of future emails, <a href="#">unsubscribe here</a>.</small></p>
</columns>
</row>

<spacer size="16"></spacer>
</container>`;

const resetPasswordTemplate = (
  user: UserDocument,
  token: string,
) => `<style type="text/css">
  body,
  html, 
  .body {
    background: #f3f3f3 !important;
  }

  .header {
    background: #f3f3f3;
  }
</style>
<!-- move the above styles into your custom stylesheet -->

<spacer size="16"></spacer>

<container>

  <row class="header">
    <columns>

      <spacer size="16"></spacer>
      
      <h4 class="text-center">Hi ${user.firstName}</h4>
    </columns>
  </row>
  <row>
    <columns>

      <spacer size="32"></spacer>

      <center>
      </center>

      <spacer size="16"></spacer>

      <h1 class="text-center">Forgot Your Password?</h1>
      
      <spacer size="16"></spacer>

      <p class="text-center">Enter the code below to reset your password.</p>
      <p class="text-center">${token}</p>
      <hr/>

      <p><small>You're getting this email because you've signed up for
       email updates. If you want to opt-out of future emails, <a href="#">unsubscribe here</a>.</small></p>
    </columns>
  </row>

  <spacer size="16"></spacer>
              </container>`;

const verifyEmailTemplate = (
  user: UserDocument,
  token: string,
) => `<style type="text/css">
  body,
  html, 
  .body {
    background: #f3f3f3 !important;
  }

  .header {
    background: #f3f3f3;
  }
</style>

<spacer size="16"></spacer>

<container>

  <row class="header">
    <columns>

      <spacer size="16"></spacer>
      
      <h4 class="text-center">Hi ${user.firstName}</h4>
    </columns>
  </row>
  <row>
    <columns>

      <spacer size="32"></spacer>

      <center>
      </center>

      <spacer size="16"></spacer>

      
      <spacer size="16"></spacer>

      <h1 class="text-center">Verify Your Account</h1>
      <spacer size="16"></spacer><p class="text-center">A request was made to verify your
       account was received. 
       Kindly use this code to verify your account:</p>
      <p class="text-center">${token}</p>
       If you did not request
       this, please ignore this email.</p>
      <hr/>

      <p><small>You're getting this email because you've signed up for email updates. If you want to opt-out of future emails, <a href="#">unsubscribe here</a>.</small></p>
    </columns>
  </row>

  <spacer size="16"></spacer>
</container>`;

const setTransactionPin = (
  user: UserDocument,
  token: string,
) => `<style type="text/css">
  body,
  html, 
  .body {
    background: #f3f3f3 !important;
  }

  .header {
    background: #f3f3f3;
  }
</style>

<spacer size="16"></spacer>

<container>

  <row class="header">
    <columns>

      <spacer size="16"></spacer>
      
      <h4 class="text-center">Hi ${user.firstName}</h4>
    </columns>
  </row>
  <row>
    <columns>

      <spacer size="32"></spacer>

      <center>
      </center>

      <spacer size="16"></spacer>

      
      <spacer size="16"></spacer>

      <h1 class="text-center">Set Transaction Pin</h1>
      <spacer size="16"></spacer><p class="text-center">A request was made to set your transaction pin. 
       Kindly use this code to set your pin:</p>
      <p class="text-center">${token}</p>
       If you did not request
       this, please ignore this email.</p>
      <hr/>

      <p><small>You're getting this email because you've signed up for email updates. If you want to opt-out of future emails, <a href="#">unsubscribe here</a>.</small></p>
    </columns>
  </row>

  <spacer size="16"></spacer>
</container>`;

const general = (content: string, subject: string) => `<style type="text/css">
  body,
  html, 
  .body {
  background: #f3f3f3 !important;
  }

  .header {
  background: #f3f3f3;
  }
</style>

<spacer size="16"></spacer>

<container>

  <row class="header">
  <columns>

      <spacer size="16"></spacer>
      
      <h4 class="text-center">Hi,</h4>
  </columns>
  </row>
  <row>
  <columns>

      <spacer size="32"></spacer>

      <center>
      </center>

      <spacer size="16"></spacer>

      <h1 class="text-center">${subject}</h1>
      
      <spacer size="16"></spacer>

      <p class="text-center">${content}</p>

      <hr/>
      
      <p><small>You're getting this email because you've signed up for email
updates. If you want to opt-out of future emails, <a href="#">unsubscribe here</a>.</small></p>
</columns>
</row>

<spacer size="16"></spacer>
</container>`;
sendgrid.setApiKey(process.env.SENDGRID_API);

export const mailService = async (
  to: any,
  subject: string,
  body: any,
  type: string,
) => {
  try {
    const msg = {
      to,
      from: process.env.MAIL_SENDER,
      subject,
      html:
        type === 'verify-email'
          ? verifyEmailTemplate(body.user, body.token)
          : type === 'reset-password'
            ? resetPasswordTemplate(body.user, body.token)
            : type === 'reset-password-successful'
              ? passwordResetConfirmationTemplate(body)
              : type === 'set-pin'
                ? setTransactionPin(body.user, body.token)
                : general(body.content, body.subject),
    };
    await sendgrid.send(msg);
  } catch (error) {
    console.log(error);
  }
};
