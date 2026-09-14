export function exclude<User, Key extends keyof User>(
  user: User,
  keys: Key[]
): Omit<User, Key> {
  const userRecord = user as Record<string, any>;
  for (const key of keys) {
    delete userRecord[key as string];
  }
  return userRecord as Omit<User, Key>;
}
