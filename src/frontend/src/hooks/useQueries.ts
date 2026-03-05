import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Message } from "../backend.d";
import { useActor } from "./useActor";

export function useGetAllMessages() {
  const { actor, isFetching } = useActor();
  return useQuery<Message[]>({
    queryKey: ["messages"],
    queryFn: async () => {
      if (!actor) return [];
      const msgs = await actor.getAllMessages();
      return msgs;
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 3000,
    staleTime: 0,
  });
}

export function usePostMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      alias,
      content,
    }: { alias: string; content: string }) => {
      if (!actor) throw new Error("No actor available");
      await actor.postMessage(alias, content);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });
}
