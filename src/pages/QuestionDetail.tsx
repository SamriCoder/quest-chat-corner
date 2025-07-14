import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown, MessageSquare, User, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from '@/hooks/use-toast';

interface Question {
  id: string;
  title: string;
  content: string;
  tags: string[] | null;
  upvotes: number;
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
    display_name: string | null;
  } | null;
}

interface Answer {
  id: string;
  content: string;
  upvotes: number;
  is_accepted: boolean;
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
    display_name: string | null;
  } | null;
}

export default function QuestionDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [question, setQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [newAnswer, setNewAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchQuestionAndAnswers();
    }
  }, [id]);

  const fetchQuestionAndAnswers = async () => {
    if (!id) return;

    // Fetch question
    const { data: questionData, error: questionError } = await supabase
      .from('questions')
      .select('*')
      .eq('id', id)
      .single();

    if (questionError) {
      console.error('Error fetching question:', questionError);
      navigate('/');
      return;
    }

    // Get question profile
    const { data: questionProfile } = await supabase
      .from('profiles')
      .select('username, display_name')
      .eq('user_id', questionData.user_id)
      .single();

    setQuestion({ ...questionData, profiles: questionProfile });

    // Fetch answers
    const { data: answersData, error: answersError } = await supabase
      .from('answers')
      .select('*')
      .eq('question_id', id)
      .order('is_accepted', { ascending: false })
      .order('upvotes', { ascending: false })
      .order('created_at', { ascending: true });

    if (answersError) {
      console.error('Error fetching answers:', answersError);
      setLoading(false);
      return;
    }

    // Get profiles for all answers
    const answersWithProfiles = await Promise.all(
      (answersData || []).map(async (answer) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, display_name')
          .eq('user_id', answer.user_id)
          .single();

        return {
          ...answer,
          profiles: profile
        };
      })
    );

    setAnswers(answersWithProfiles);
    setLoading(false);
  };

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id || !newAnswer.trim()) return;

    setSubmitting(true);

    const { error } = await supabase
      .from('answers')
      .insert({
        question_id: id,
        user_id: user.id,
        content: newAnswer.trim(),
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to submit answer. Please try again.",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Your answer has been posted!"
      });
      setNewAnswer('');
      fetchQuestionAndAnswers();
    }

    setSubmitting(false);
  };

  const handleVote = async (type: 'question' | 'answer', itemId: string, voteType: number) => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to vote.",
        variant: "destructive"
      });
      return;
    }

    const table = type === 'question' ? 'questions' : 'answers';
    const column = type === 'question' ? 'question_id' : 'answer_id';

    // First, check if user has already voted
    const { data: existingVote } = await supabase
      .from('votes')
      .select('*')
      .eq('user_id', user.id)
      .eq(column, itemId)
      .single();

    if (existingVote) {
      if (existingVote.vote_type === voteType) {
        // Remove vote if clicking same vote
        await supabase
          .from('votes')
          .delete()
          .eq('id', existingVote.id);
      } else {
        // Update vote if different
        await supabase
          .from('votes')
          .update({ vote_type: voteType })
          .eq('id', existingVote.id);
      }
    } else {
      // Create new vote
      await supabase
        .from('votes')
        .insert({
          user_id: user.id,
          [column]: itemId,
          vote_type: voteType,
        });
    }

    // Refresh data
    fetchQuestionAndAnswers();
  };

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

  if (!question) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Question not found.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Question */}
          <Card>
            <CardHeader>
              <div className="flex items-start space-x-4">
                <div className="flex flex-col items-center space-y-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleVote('question', question.id, 1)}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <span className="font-medium">{question.upvotes}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleVote('question', question.id, -1)}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex-1">
                  <CardTitle className="text-2xl">{question.title}</CardTitle>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <User className="h-3 w-3" />
                      <span>{question.profiles?.display_name || question.profiles?.username || 'Anonymous'}</span>
                    </div>
                    <span>
                      asked {formatDistanceToNow(new Date(question.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="prose max-w-none">
                <p className="whitespace-pre-wrap">{question.content}</p>
              </div>
              
              {question.tags && question.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {question.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Answers */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <h2 className="text-xl font-semibold">
                {answers.length} {answers.length === 1 ? 'Answer' : 'Answers'}
              </h2>
            </div>

            {answers.map((answer) => (
              <Card key={answer.id} className={answer.is_accepted ? 'border-green-500' : ''}>
                <CardContent className="pt-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex flex-col items-center space-y-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleVote('answer', answer.id, 1)}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <span className="font-medium">{answer.upvotes}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleVote('answer', answer.id, -1)}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      {answer.is_accepted && (
                        <Check className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="prose max-w-none mb-4">
                        <p className="whitespace-pre-wrap">{answer.content}</p>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <User className="h-3 w-3" />
                          <span>{answer.profiles?.display_name || answer.profiles?.username || 'Anonymous'}</span>
                        </div>
                        <span>
                          answered {formatDistanceToNow(new Date(answer.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Answer form */}
          {user ? (
            <Card>
              <CardHeader>
                <CardTitle>Your Answer</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitAnswer} className="space-y-4">
                  <Textarea
                    placeholder="Write your answer here..."
                    value={newAnswer}
                    onChange={(e) => setNewAnswer(e.target.value)}
                    rows={6}
                    required
                  />
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Posting..." : "Post Answer"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="mb-4">Please sign in to answer this question.</p>
                <Button onClick={() => navigate('/auth')}>Sign In</Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}