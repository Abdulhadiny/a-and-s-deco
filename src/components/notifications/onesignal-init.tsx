"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

export function OneSignalInit() {
  const { data: session } = useSession();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current || !session?.user?.id) return;
    initialized.current = true;

    import("react-onesignal").then(({ default: OneSignal }) => {
      OneSignal.init({
        appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!,
        notifyButton: { enable: false } as Parameters<typeof OneSignal.init>[0]["notifyButton"],
        allowLocalhostAsSecureOrigin: true,
      })
        .then(() => {
          OneSignal.login(session.user.id!);
          OneSignal.Notifications.requestPermission();
        })
        .catch(() => {});
    });
  }, [session?.user?.id]);

  return null;
}
