import * as React from 'react';

interface EmailTemplateProps {
  otp: string;
}

export const EmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({ otp }) => {
  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-200 to-blue-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Welcome to Our Service</h1>
          <p className="text-gray-600 mt-2">
            We're thrilled to have you on board!
          </p>
        </div>
        <div className="bg-gray-50 p-6 rounded-md border border-gray-200 text-center mb-6">
          <p className="text-gray-700 mb-2">Your One-Time Password (OTP):</p>
          <span className="text-2xl font-bold text-blue-500 tracking-wider">
            {otp}
          </span>
        </div>
        <p className="text-gray-600 text-center mb-4">
          Please use the OTP above to verify your email address. If you did not request this, please ignore this email.
        </p>
        <div className="text-center text-xs text-gray-400">
          &copy; {new Date().getFullYear()} Our Service. All rights reserved.
        </div>
      </div>
    </div>
  );
};
