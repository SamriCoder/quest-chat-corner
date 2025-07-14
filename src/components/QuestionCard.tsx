import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, ArrowUp, User } from 'lucide-react';

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
  answers?: { count: number }[];
}

interface QuestionCardProps {
  question: Question;
}

export function QuestionCard({ question }: QuestionCardProps) {
  const answerCount = question.answers?.[0]?.count || 0;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between space-x-4">
          <CardTitle className="text-lg leading-tight">
            <Link 
              to={`/question/${question.id}`}
              className="hover:text-primary transition-colors"
            >
              {question.title}
            </Link>
          </CardTitle>
          <div className="flex items-center space-x-1 text-muted-foreground">
            <ArrowUp className="h-4 w-4" />
            <span className="text-sm">{question.upvotes}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-muted-foreground line-clamp-2">
          {question.content}
        </p>
        
        {question.tags && question.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {question.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
        
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <User className="h-3 w-3" />
              <span>{question.profiles?.display_name || question.profiles?.username || 'Anonymous'}</span>
            </div>
            <div className="flex items-center space-x-1">
              <MessageSquare className="h-3 w-3" />
              <span>{answerCount} answers</span>
            </div>
          </div>
          <span>
            {formatDistanceToNow(new Date(question.created_at), { addSuffix: true })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}