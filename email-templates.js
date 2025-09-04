const EmailTemplates = {
  taskDetected: (taskData) => ({
    subject: "RHAT - New Task Available!",
    body: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">🎉 New Task Detected!</h2>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Page:</strong> ${
            taskData.url || "RaterHub Evaluation Page"
          }</p>
          <p><strong>Status:</strong> Task is available for acquisition</p>
        </div>
        <p style="color: #666; font-size: 14px;">
          This notification was sent by RHAT - RaterHub Automated Tasks extension.
        </p>
      </div>
    `,
  }),

  testEmail: () => ({
    subject: "RHAT - Test Email",
    body: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">✅ Test Email Successful!</h2>
        <p>Your Gmail integration is working correctly.</p>
        <p style="color: #666; font-size: 14px;">
          Sent by RHAT extension at ${new Date().toLocaleString()}
        </p>
      </div>
    `,
  }),
};
