import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import { getConvexErrorFromUnknown } from "@/lib/i18n/convex-errors";
import { resolveLocale } from "@/lib/i18n/locales";

type ConvexQuery = Parameters<typeof useQuery>[0];
type ConvexMutation = Parameters<typeof useMutation>[0];

/**
 * @deprecated Prefer `useQuery` from `convex/react` directly. See docs/FRONTEND.md.
 */
export function useConvexQuery(
  query: ConvexQuery,
  ...args: Parameters<typeof useQuery> extends [unknown, ...infer R] ? R : never
) {
  const result = useQuery(query, ...(args as []));
  const [data, setData] = useState<typeof result>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (result === undefined) {
      setIsLoading(true);
    } else {
      setData(result);
      setError(null);
      setIsLoading(false);
    }
  }, [result]);

  return { data, isLoading, error };
}

/**
 * @deprecated Prefer `useMutation` from `convex/react` directly.
 */
export function useConvexMutation(mutation: ConvexMutation) {
  const mutationFn = useMutation(mutation);
  const locale = resolveLocale(useLocale());
  const [data, setData] = useState<unknown>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = async (...args: Parameters<typeof mutationFn>) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await mutationFn(...args);
      setData(response);
      return response;
    } catch (err) {
      const message = getConvexErrorFromUnknown(err, locale);
      setError(new Error(message));
      toast.error(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { mutate, data, isLoading, error };
}
