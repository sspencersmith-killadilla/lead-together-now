import React from 'react'
import { Body, Container, Head, Heading, Html, Preview, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  fromName?: string
  fromEmail?: string
  message?: string
  page?: string
}

const Email = ({ fromName, fromEmail, message, page }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Help request from {fromName || 'a Tandem user'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={heading}>Help request</Heading>
        <Text style={text}><strong>From:</strong> {fromName || 'Unknown'} ({fromEmail || 'no email given'})</Text>
        {page ? <Text style={text}><strong>Page:</strong> {page}</Text> : null}
        <Text style={text}><strong>Message:</strong></Text>
        <Text style={messageBox}>{message || ''}</Text>
        <Text style={muted}>Reply directly to the sender's address above.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) => `Tandem help request from ${d.fromName || d.fromEmail || 'a user'}`,
  displayName: 'Help request',
  previewData: { fromName: 'Jordan Lee', fromEmail: 'jordan@example.org', message: 'How do I change a pairing template?', page: '/home' },
  // Fixed recipient: help requests always go to the site owner. Users never see this address.
  to: 's.spencersmith@gmail.com',
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '20px 25px' }
const heading = { color: '#0f3d46', fontFamily: 'Montserrat, Arial, sans-serif' }
const text = { color: '#1f2937', fontSize: '14px' }
const messageBox = { color: '#1f2937', fontSize: '14px', backgroundColor: '#f3f4f6', padding: '12px', borderRadius: '6px', whiteSpace: 'pre-wrap' as const }
const muted = { color: '#6b7280', fontSize: '12px' }
