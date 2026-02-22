import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { LogOut, Sparkles, User, RefreshCw, LayoutDashboard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import MatchCard, { type Match } from "@/components/dashboard/MatchCard";
import HelpChatButton from "@/components/dashboard/HelpChatButton";

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const displayName =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "there";

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const generateMatches = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "Please log in first", variant: "destructive" });
        return;
      }

      const resp = await fetch(`/api/generate-matches?t=${Date.now()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || "Failed to generate matches");
      }

      const data = await resp.json();
      setMatches(data.matches || []);
      setHasGenerated(true);

      if (data.matches?.length > 0) {
        toast({ title: `${data.matches.length} AI-curated matches found` });
      } else {
        toast({ title: "No matches yet — more participants needed" });
      }
    } catch (e: any) {
      console.error(e);
      toast({ title: "Error generating matches", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <nav className="border-b border-border/50 px-6 md:px-16 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
          <span className="font-serif text-lg tracking-wide text-foreground">
            Proof of Talk <span className="text-primary font-semibold">Atlas</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground font-sans hidden sm:inline">{user?.email}</span>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-6 md:px-16 py-10 max-w-6xl">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <h1 className="text-3xl md:text-4xl font-serif text-foreground mb-1">
            Welcome back, <span className="text-primary">{displayName}</span>
          </h1>
          <p className="text-muted-foreground font-sans text-sm max-w-xl">
            Your AI matchmaking engine is ready. Generate or refresh your curated connections below.
          </p>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="flex flex-wrap gap-3 mb-10"
        >
          <Button variant="hero" size="xl" onClick={generateMatches} disabled={loading}>
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Analyzing Profiles...
              </>
            ) : hasGenerated ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Matches
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate AI Matches
              </>
            )}
          </Button>
          <Button variant="heroOutline" size="xl" onClick={() => navigate("/profile")}>
            <User className="w-4 h-4 mr-2" />
            My Profile
          </Button>
          <Button variant="heroOutline" size="xl" onClick={() => navigate("/my-connections")}>
            <LayoutDashboard className="w-4 h-4 mr-2" />
            My Connections
          </Button>
        </motion.div>

        {/* Section Header */}
        {(hasGenerated || matches.length > 0) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 mb-6"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs font-sans tracking-widest uppercase text-primary font-semibold">
              Recommended Matches — Ranked
            </span>
          </motion.div>
        )}

        {/* Empty State */}
        {hasGenerated && matches.length === 0 && (
          <div className="text-center py-16 border border-border/50 rounded-xl bg-card/20">
            <Sparkles className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground font-sans">
              No matches yet. More participants need to complete their strategic profiles.
            </p>
          </div>
        )}

        {/* Matches Grid */}
        {matches.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {matches.map((match, i) => (
              <MatchCard key={match.matched_user_id} match={match} index={i} />
            ))}
          </div>
        )}
      </div>
      <HelpChatButton />
    </div>
  );
};

export default Dashboard;
