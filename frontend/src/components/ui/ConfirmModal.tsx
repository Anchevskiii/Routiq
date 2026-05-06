import React from 'react'
import { Modal } from './Modal'
import { Button } from './Button'

export interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  isLoading?: boolean
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen, onClose, onConfirm, title, message, confirmText = 'Potrdi', cancelText = 'Prekliči', isLoading
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>{cancelText}</Button>
          <Button variant="danger" onClick={onConfirm} isLoading={isLoading}>{confirmText}</Button>
        </>
      }
    >
      <p>{message}</p>
    </Modal>
  )
}
