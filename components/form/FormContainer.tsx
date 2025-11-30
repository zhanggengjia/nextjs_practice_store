'use client';
import { useActionState } from 'react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { actionFunction } from '@/utils/types';

const initialState = { message: '' };

function FormContainer({
  action,
  children,
}: {
  action: actionFunction;
  children: React.ReactNode;
}) {
  const [state, formAction] = useActionState(action, initialState);
  useEffect(() => {
    console.log(state.message);
    if (state.message) {
      toast.success(state.message);
    }
  }, [state]);
  return <form action={formAction}>{children}</form>;
}

export default FormContainer;
