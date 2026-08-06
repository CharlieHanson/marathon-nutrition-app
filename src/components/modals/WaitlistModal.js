import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
import { Button } from '@/src/components/shared/Button';
import { Input } from '@/src/components/shared/Input';
import { Label } from '@/src/components/ui/label';
import { Textarea } from '@/src/components/ui/textarea';
import { getApiUrl } from '../../../shared/services/api';

/**
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {'individual' | 'nutritionist'} props.userType
 * @param {string} [props.title]
 * @param {string} [props.description]
 */
export function WaitlistModal({
  isOpen,
  onClose,
  userType,
  title = 'Join the waitlist',
  description = 'Tell us a bit about yourself. We’ll only use this to notify you when access opens.',
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setName('');
    setEmail('');
    setNotes('');
    setError('');
    setSuccess('');
    setSubmitting(false);
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const res = await fetch(getApiUrl('/api/waitlist'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          notes: notes.trim(),
          userType,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        setError(data.error || 'Could not join the waitlist. Please try again.');
        return;
      }

      setSuccess(data.message || "You're on the list — thanks for joining!");
    } catch (err) {
      console.error('WaitlistModal submit error:', err);
      setError('Network error. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="space-y-4">
            <p className="rounded-lg border border-primary/20 bg-mint/40 px-4 py-3 text-sm font-medium text-primary">
              {success}
            </p>
            <DialogFooter>
              <Button type="button" variant="primary" onClick={onClose}>
                Close
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
              autoComplete="name"
              disabled={submitting}
            />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              disabled={submitting}
            />
            <div className="space-y-2">
              <Label htmlFor="waitlist-notes">
                What are you looking for?{' '}
                <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="waitlist-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Why you're interested, goals, team size…"
                rows={4}
                maxLength={2000}
                disabled={submitting}
                className="resize-y"
              />
            </div>

            {error ? (
              <p className="text-sm font-medium text-red-600">{error}</p>
            ) : null}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting ? 'Submitting…' : 'Join waitlist'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default WaitlistModal;
