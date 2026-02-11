import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    MessageSquare,
    User,
    Calendar,
    Bold,
    Italic,
    Link as LinkIcon,
    List,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface TimelineActivity {
    id: string;
    type: "comment" | "status_change" | "assignment_change" | "created";
    user: string;
    content: string;
    timestamp: string;
    metadata?: Record<string, any>;
}

interface Deal {
    id: string;
    title: string;
    timeline?: TimelineActivity[];
}

interface DealTimelineTabProps {
    deal: Deal;
    onUpdate: (deal: Deal) => void;
}

export function DealTimelineTab({ deal, onUpdate }: DealTimelineTabProps) {
    const [comment, setComment] = useState("");
    const [isBold, setIsBold] = useState(false);
    const [isItalic, setIsItalic] = useState(false);

    // Sample timeline data (in real app, fetch from Supabase activities table)
    const [activities, setActivities] = useState<TimelineActivity[]>(
        deal.timeline || [
            {
                id: "1",
                type: "created",
                user: "Sistema",
                content: "Oportunidade criada",
                timestamp: "2026-02-10T14:30:00",
            },
            {
                id: "2",
                type: "status_change",
                user: "Jefferson Silva",
                content: "Moveu de 'Novo Contato' para 'Em Contato'",
                timestamp: "2026-02-10T15:45:00",
                metadata: { from: "new_contact", to: "in_contact" },
            },
            {
                id: "3",
                type: "comment",
                user: "Jefferson Silva",
                content: "Cliente demonstrou interesse no produto premium. Agendar demonstração para amanhã às 14h.",
                timestamp: "2026-02-10T16:20:00",
            },
            {
                id: "4",
                type: "assignment_change",
                user: "Sistema",
                content: "Responsável alterado para Jefferson Silva",
                timestamp: "2026-02-10T16:21:00",
            },
        ]
    );

    const handleAddComment = () => {
        if (!comment.trim()) return;

        const newActivity: TimelineActivity = {
            id: `temp-${Date.now()}`,
            type: "comment",
            user: "Você", // In real app, get from auth context
            content: comment,
            timestamp: new Date().toISOString(),
        };

        setActivities([newActivity, ...activities]);
        setComment("");

        // Update deal
        onUpdate({
            ...deal,
            timeline: [newActivity, ...activities],
        });
    };

    const applyFormat = (format: 'bold' | 'italic' | 'link' | 'list') => {
        const textarea = document.getElementById('comment-textarea') as HTMLTextAreaElement;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = comment.substring(start, end);

        let formattedText = '';

        switch (format) {
            case 'bold':
                formattedText = `**${selectedText}**`;
                break;
            case 'italic':
                formattedText = `*${selectedText}*`;
                break;
            case 'link':
                formattedText = `[${selectedText || 'texto do link'}](https://exemplo.com)`;
                break;
            case 'list':
                formattedText = `- ${selectedText}\n- `;
                break;
        }

        const newComment =
            comment.substring(0, start) +
            formattedText +
            comment.substring(end);

        setComment(newComment);

        // Refocus textarea
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(
                start + formattedText.length,
                start + formattedText.length
            );
        }, 0);
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case "comment":
                return <MessageSquare className="h-4 w-4" />;
            case "status_change":
                return <Calendar className="h-4 w-4" />;
            case "assignment_change":
                return <User className="h-4 w-4" />;
            default:
                return <MessageSquare className="h-4 w-4" />;
        }
    };

    const getActivityColor = (type: string) => {
        switch (type) {
            case "comment":
                return "bg-blue-100 text-blue-700";
            case "status_change":
                return "bg-green-100 text-green-700";
            case "assignment_change":
                return "bg-purple-100 text-purple-700";
            case "created":
                return "bg-gray-100 text-gray-700";
            default:
                return "bg-gray-100 text-gray-700";
        }
    };

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return "Agora";
        if (diffMins < 60) return `${diffMins}min atrás`;
        if (diffHours < 24) return `${diffHours}h atrás`;
        if (diffDays < 7) return `${diffDays}d atrás`;

        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getUserInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    return (
        <div className="space-y-6">
            {/* Comment Editor */}
            <Card>
                <CardContent className="pt-6">
                    <div className="space-y-3">
                        {/* Formatting Toolbar */}
                        <div className="flex gap-1 border-b pb-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => applyFormat('bold')}
                                title="Negrito"
                            >
                                <Bold className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => applyFormat('italic')}
                                title="Itálico"
                            >
                                <Italic className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => applyFormat('link')}
                                title="Adicionar link"
                            >
                                <LinkIcon className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => applyFormat('list')}
                                title="Lista"
                            >
                                <List className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Textarea */}
                        <Textarea
                            id="comment-textarea"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Adicione um comentário, use **negrito**, *itálico*, [link](url) ou listas..."
                            className="min-h-[120px] resize-none"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                    handleAddComment();
                                }
                            }}
                        />

                        <div className="flex justify-between items-center">
                            <p className="text-xs text-muted-foreground">
                                Dica: Use Ctrl+Enter para comentar rapidamente
                            </p>
                            <Button onClick={handleAddComment} disabled={!comment.trim()}>
                                <MessageSquare className="mr-2 h-4 w-4" />
                                Comentar
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Timeline */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Histórico de Atividades</h3>

                {activities.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                            <p className="text-muted-foreground">Nenhuma atividade registrada ainda</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {activities.map((activity, index) => (
                            <div key={activity.id}>
                                <div className="flex gap-3">
                                    {/* Avatar */}
                                    <Avatar className="h-9 w-9 mt-1">
                                        <AvatarFallback className="text-xs">
                                            {getUserInitials(activity.user)}
                                        </AvatarFallback>
                                    </Avatar>

                                    {/* Activity Content */}
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-semibold text-sm">{activity.user}</span>
                                            <Badge variant="outline" className={`${getActivityColor(activity.type)} border-0`}>
                                                <div className="flex items-center gap-1">
                                                    {getActivityIcon(activity.type)}
                                                    <span className="text-xs capitalize">
                                                        {activity.type === 'comment' && 'Comentário'}
                                                        {activity.type === 'status_change' && 'Mudança de Status'}
                                                        {activity.type === 'assignment_change' && 'Atribuição'}
                                                        {activity.type === 'created' && 'Criação'}
                                                    </span>
                                                </div>
                                            </Badge>
                                            <span className="text-xs text-muted-foreground ml-auto">
                                                {formatTimestamp(activity.timestamp)}
                                            </span>
                                        </div>

                                        <Card className="bg-muted/30">
                                            <CardContent className="p-3">
                                                <p className="text-sm whitespace-pre-wrap">{activity.content}</p>

                                                {activity.metadata && (
                                                    <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
                                                        {activity.metadata.from && activity.metadata.to && (
                                                            <span>
                                                                De: <code className="px-1 bg-background rounded">{activity.metadata.from}</code>
                                                                {' → '}
                                                                Para: <code className="px-1 bg-background rounded">{activity.metadata.to}</code>
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>

                                {index < activities.length - 1 && (
                                    <Separator className="my-4 ml-6" />
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
