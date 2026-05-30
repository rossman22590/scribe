'use client';

import {
  Children,
  isValidElement,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

type ConfirmSubmitButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  confirmText: string;
  confirmTitle?: string;
  confirmDescription?: string;
  confirmLabel?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
};

function parseConfirmText(confirmText: string) {
  const questionIndex = confirmText.indexOf('?');

  if (questionIndex === -1) {
    return { title: confirmText, description: undefined };
  }

  const title = confirmText.slice(0, questionIndex + 1).trim();
  const description = confirmText.slice(questionIndex + 1).trim();

  return {
    title,
    description: description || undefined,
  };
}

function getButtonLabel(children: ReactNode, fallback: string) {
  const labels: string[] = [];

  Children.forEach(children, (child) => {
    if (typeof child === 'string' || typeof child === 'number') {
      const text = String(child).trim();
      if (text) labels.push(text);
      return;
    }

    if (isValidElement<{ children?: ReactNode }>(child) && child.props.children) {
      const nested = getButtonLabel(child.props.children, '');
      if (nested) labels.push(nested);
    }
  });

  return labels.join(' ').trim() || fallback;
}

export function ConfirmSubmitButton({
  confirmText,
  confirmTitle,
  confirmDescription,
  confirmLabel,
  children,
  onClick,
  variant,
  size,
  className,
  disabled,
  ...props
}: ConfirmSubmitButtonProps) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const parsed = parseConfirmText(confirmText);
  const title = confirmTitle ?? parsed.title;
  const description = confirmDescription ?? parsed.description;
  const actionLabel = confirmLabel ?? getButtonLabel(children, 'Confirm');
  const isDestructive = variant === 'destructive';

  const handleConfirm = (event: MouseEvent<HTMLButtonElement>) => {
    setOpen(false);

    const form = buttonRef.current?.closest('form');
    if (form) {
      form.requestSubmit();
    }

    onClick?.(event);
  };

  return (
    <>
      <Button
        {...props}
        ref={buttonRef}
        type="button"
        variant={variant}
        size={size}
        className={className}
        disabled={disabled}
        onClick={(event) => {
          event.preventDefault();
          setOpen(true);
        }}
      >
        {children}
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent className="z-[100] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            {description ? (
              <AlertDialogDescription>{description}</AlertDialogDescription>
            ) : null}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className={
                isDestructive
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  : undefined
              }
            >
              {actionLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
