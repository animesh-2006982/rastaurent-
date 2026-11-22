"use client";

import type { ReactNode, MouseEvent } from "react";

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export default function Modal({ open, title, onClose, children }: ModalProps) {
  if (!open) return null;
  return <div className="ct-modal-overlay" onMouseDown={onClose}>
    <div className="ct-modal" onMouseDown={(event: MouseEvent<HTMLDivElement>) => event.stopPropagation()}>
      <div className="ct-modal-header"><h3>{title}</h3><button className="ct-close" onClick={onClose}>×</button></div>
      <div className="ct-modal-body">{children}</div>
    </div>
  </div>;
}
