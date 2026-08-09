"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";

export default function SessionCacheSync() {
  const queryClient = useQueryClient();
  const lastUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data }) => {
      if (lastUserIdRef.current === undefined) {
        lastUserIdRef.current = data.session?.user?.id ?? null;
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const nextUserId = session?.user?.id ?? null;
      const prevUserId = lastUserIdRef.current;

      if (event === "SIGNED_OUT") {
        queryClient.clear();
        lastUserIdRef.current = null;
        return;
      }

      if (
        prevUserId !== undefined &&
        prevUserId !== null &&
        nextUserId === prevUserId
      ) {
        return;
      }

      if (
        nextUserId !== null &&
        prevUserId !== undefined &&
        prevUserId !== nextUserId
      ) {
        queryClient.clear();
      }

      lastUserIdRef.current = nextUserId;
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  return null;
}
