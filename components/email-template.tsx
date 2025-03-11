import * as React from 'react';

interface EmailTemplateProps {
  otp: number;
}

export const EmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({
  otp,
}) => (
  <div>
    <h1>Welcome, {otp}!</h1>
  </div>
);