'use server'

import { z } from 'zod'

// Schema for message validation
const sendMessageSchema = z.object({
  phoneNumber: z.string().min(8),
  text: z.string().min(1),
})

// Type for the response
type SendMessageResponse = {
  success: boolean
  error?: string
  data?: any
}

export async function sendWhatsappMessage(
  phoneNumber: string,
  text: string
): Promise<SendMessageResponse> {
  try {
    // Validate input
    const validated = sendMessageSchema.parse({ phoneNumber, text })

    // Clean phone number - remove any non-digits
    const cleanPhone = validated.phoneNumber.replace(/\D/g, '')

    // API configuration from environment variables
    const API_BASE_URL = process.env.NEXT_PUBLIC_EVOLUTION_API_URL
    const API_KEY = process.env.NEXT_PUBLIC_EVOLUTION_API_KEY
    const INSTANCE_NAME = process.env.NEXT_PUBLIC_EVOLUTION_INSTANCE || 'Test'

    if (!API_BASE_URL || !API_KEY) {
      throw new Error('Missing Evolution API configuration')
    }

    // Make API request
    const response = await fetch(`${API_BASE_URL}/message/sendText/${INSTANCE_NAME}`, {
      method: 'POST',
      headers: {
        'apikey': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        number: cleanPhone,
        text: validated.text,
        // Optional parameters
        delay: 1000, // 1 second delay
        linkPreview: true,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to send message')
    }

    const data = await response.json()
    return {
      success: true,
      data,
    }

  } catch (error) {
    console.error('Error sending WhatsApp message:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send message',
    }
  }
} 