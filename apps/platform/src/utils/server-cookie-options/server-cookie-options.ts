export const toServerCookieOptions = (maxAge: number) =>
  ({
    maxAge,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  }) as const;
