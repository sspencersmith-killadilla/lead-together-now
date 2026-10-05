import React from "react";
import { Body, Button, Container, Head, Heading, Html, Preview, Text } from "@react-email/components";
import type { TemplateEntry } from "./registry";

interface Props { name?: string; people?: { name: string; days: number }[]; link?: string }

const Email = ({ name, people = [], link = "https://tandem.civicplexus.org/home" }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{`${people.length} 1-on-1${people.length === 1 ? " is" : "s are"} overdue`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>Tandem</Text>
        <Heading style={h1}>Time to catch up{name ? `, ${name}` : ""}</Heading>
        <Text style={text}>These 1-on-1s are past their usual rhythm:</Text>
        {people.map((p) => (
          <Text key={p.name} style={item}>• {p.name} — last met {p.days} days ago</Text>
        ))}
        <Button href={link} style={button}>Open your 1-on-1s</Button>
        <Text style={muted}>You can turn these reminders off in Settings → Your account.</Text>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: Email,
  subject: (d: Record<string, any>) => {
    const n = (d["people"] ?? []).length;
    return `${n} 1-on-1${n === 1 ? " is" : "s are"} overdue`;
  },
  displayName: "Overdue 1-on-1 reminder",
  previewData: { name: "Jordan", people: [{ name: "Priya Shah", days: 21 }, { name: "Sam Ortiz", days: 30 }], link: "https://tandem.civicplexus.org/home" },
} satisfies TemplateEntry;

const main = { backgroundColor: "#ffffff", fontFamily: "Inter, Arial, sans-serif" };
const container = { padding: "32px 28px", maxWidth: "560px" };
const brand = { fontFamily: "Montserrat, Arial, sans-serif", fontWeight: 700, color: "#0f766e", fontSize: "18px", margin: "0 0 24px" };
const h1 = { fontFamily: "Montserrat, Arial, sans-serif", fontSize: "24px", fontWeight: 700, color: "#0b2f3a", margin: "0 0 16px" };
const text = { fontSize: "15px", lineHeight: "24px", color: "#334155", margin: "0 0 12px" };
const item = { fontSize: "15px", lineHeight: "22px", color: "#0b2f3a", margin: "0 0 6px" };
const button = { backgroundColor: "#0b3b4a", color: "#ffffff", borderRadius: "8px", padding: "12px 22px", fontSize: "15px", fontWeight: 600, textDecoration: "none", marginTop: "16px" };
const muted = { fontSize: "13px", color: "#64748b", marginTop: "28px" };
