'use client';
import { useEffect } from 'react';
export function Event({ name }: { name: string }) {
  useEffect(() => {
    fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    }).catch(() => {});
  }, [name]);
  return null;
}
