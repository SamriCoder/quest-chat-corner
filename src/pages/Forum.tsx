import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { QuestionCard } from '@/components/QuestionCard';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Question {
  id: string;
  title: string;
  content: string;
  tags: string[] | null;
  upvotes: number;
  created_at: string;
  profiles: {
    username: string;
    display_name: string | null;
  } | null;
  answers: { count: number }[];
}

export default function Forum() {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching questions:', error);
      setLoading(false);
      return;
    }

    // Fetch profiles and answer counts separately
    const questionsWithDetails = await Promise.all(
      (data || []).map(async (question) => {
        // Get profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, display_name')
          .eq('user_id', question.user_id)
          .single();

        // Get answer count
        const { count } = await supabase
          .from('answers')
          .select('*', { count: 'exact', head: true })
          .eq('question_id', question.id);
        
        return {
          ...question,
          profiles: profile,
          answers: [{ count: count || 0 }]
        };
      })
    );
    
    setQuestions(questionsWithDetails);
    setLoading(false);
  };

  const filteredQuestions = questions.filter(question =>
    question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    question.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    question.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Discussion Forum</h1>
            {user && (
              <Link to="/ask">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Ask Question
                </Button>
              </Link>
            )}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {!user && (
            <div className="bg-muted/50 rounded-lg p-6 text-center">
              <h2 className="text-xl font-semibold mb-2">Join the Discussion</h2>
              <p className="text-muted-foreground mb-4">
                Sign in to ask questions, answer others, and participate in the community.
              </p>
              <Link to="/auth">
                <Button>Sign In to Participate</Button>
              </Link>
            </div>
          )}

          <div className="space-y-4">
            {filteredQuestions.length > 0 ? (
              filteredQuestions.map((question) => (
                <QuestionCard key={question.id} question={question} />
              ))
            ) : (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-muted-foreground">
                  {searchTerm ? 'No questions found matching your search.' : 'No questions yet.'}
                </h3>
                {user && (
                  <p className="text-muted-foreground mt-2">
                    Be the first to ask a question!
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}