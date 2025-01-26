import React from "react";
import { EuiText } from "@elastic/eui";

interface FallbackMessageProps {
  title: string;
  message: string;
  color?: "danger" | "default" | "subdued" | "success" | "accent" | "warning" | "ghost"; // Tipi accettati
}

export const FallbackMessage: React.FC<FallbackMessageProps> = ({
  title,
  message,
  color = "danger",
}) => (
  <div>
    <EuiText color={color}>
      <h3>{title}</h3>
      <p>{message}</p>
    </EuiText>
  </div>
);
