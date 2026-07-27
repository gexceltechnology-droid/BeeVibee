export function isSMSConfigured(): boolean {
  return false; // Twilio SMS disabled
}

export async function sendSMS(
  to: string,
  body: string
): Promise<{ success: boolean; error?: string }> {
  console.log(`[SMS Disabled] Twilio SMS disabled. Message for ${to}: ${body}`);
  return {
    success: true,
  };
}
