import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ApiEntry {
  id: string;
  name: string;
  url: string | null;
  api_key: string | null;
  status: 'stable' | 'unstable' | 'offline';
  category: string | null;
  description: string | null;
  created_at: string;
}

export const useApiManager = () => {
  const queryClient = useQueryClient();

  const { data: apis, isLoading } = useQuery({
    queryKey: ["api_manager"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("api_manager")
        .select("*")
        .order("category", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;
      return data as ApiEntry[];
    },
  });

  const addApi = useMutation({
    mutationFn: async (newApi: Partial<ApiEntry>) => {
      const { data, error } = await (supabase as any)
        .from("api_manager")
        .insert([newApi])
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api_manager"] });
      toast.success("API adicionada com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao adicionar API:", error);
      toast.error("Erro ao adicionar API");
    },
  });

  const deleteApi = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("api_manager")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api_manager"] });
      toast.success("API removida com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao remover API:", error);
      toast.error("Erro ao remover API");
    },
  });

  const updateApiStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ApiEntry['status'] }) => {
      const { error } = await (supabase as any)
        .from("api_manager")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api_manager"] });
    },
  });

  return {
    apis,
    isLoading,
    addApi,
    deleteApi,
    updateApiStatus
  };
};

export const useApiUsageStats = () => {
  return useQuery({
    queryKey: ["api_usage_stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_logs")
        .select("agent_id, type, created_at")
        .order("created_at", { ascending: false })
        .limit(500);

      if (error) throw error;

      // Group by agent
      const byAgent: Record<string, number> = {};
      const byDay: Record<string, number> = {};
      let total = 0;
      let successes = 0;

      data?.forEach(log => {
        total++;
        const agent = log.agent_id || 'system';
        byAgent[agent] = (byAgent[agent] || 0) + 1;
        
        if (log.type === 'success') successes++;

        const day = new Date(log.created_at).toLocaleDateString('pt-BR', { weekday: 'short' });
        byDay[day] = (byDay[day] || 0) + 1;
      });

      return {
        total,
        successRate: total > 0 ? (successes / total) * 100 : 0,
        byAgent: Object.entries(byAgent).map(([name, value]) => ({ name, value })),
        byDay: Object.entries(byDay).map(([name, value]) => ({ name, value })).reverse().slice(0, 7)
      };
    },
    refetchInterval: 30000, // Refresh every 30s
  });
};
