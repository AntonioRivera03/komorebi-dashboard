"""Learn's bounded authoring workspace. Subject IDs never identify Study practice runs."""

import json
from typing import Annotated, Literal

from pydantic import Field, StringConstraints, model_validator

from komorebi_server.shared.contracts.common import Contract

Id = Annotated[str, StringConstraints(min_length=1, max_length=100, pattern=r"^[\w-]+$")]
Title = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=300)]
Topic = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]
Text = Annotated[str, StringConstraints(max_length=20000)]
Instant = Annotated[float, Field(ge=0, le=8640000000000000, allow_inf_nan=False)]


class Subject(Contract):
    id: Id
    title: Title
    description: Text
    topics: list[Topic] = Field(max_length=200)
    symbol: str = Field(max_length=20)


class Artifact(Contract):
    id: Id
    session_id: Id
    topic: Topic
    body: Text
    updated_at: Instant
    highlight_id: Id | None = None


class Deck(Contract):
    id: Id
    session_id: Id
    title: Title
    topic: Topic


class Card(Contract):
    id: Id
    deck_id: Id
    topic: Topic
    front: Text
    back: Text
    artifact_id: Id | None = None
    repetitions: int = Field(ge=0)
    interval: int = Field(ge=0)
    ease: float = Field(ge=1.3, le=100, allow_inf_nan=False)
    due_at: Instant


class Review(Contract):
    id: Id
    card_id: Id
    deck_id: Id
    session_id: Id
    quality: int = Field(ge=0, le=5)
    at: Instant
    previous: Card
    next: Card


class QuizQuestion(Contract):
    id: Id
    card_id: Id | None = None
    front: Text
    back: Text


class Material(Contract):
    id: Id
    session_id: Id
    kind: Literal["source", "quiz", "exam"]
    title: Title
    topic: Topic
    content: str = Field(max_length=200000)
    answer: Text | None = None
    route: str | None = Field(default=None, max_length=500, pattern=r"^/learn/[\w/?=&-]+$")
    url: str | None = Field(default=None, max_length=2000, pattern=r"^https?://[^\s]+$")
    source_type: Literal["website", "file", "text"] | None = None
    file_name: str | None = Field(default=None, max_length=300)
    questions: list[QuizQuestion] | None = Field(default=None, min_length=1, max_length=200)


class Highlight(Contract):
    id: Id
    source_id: Id
    start: int = Field(ge=0)
    end: int = Field(gt=0)
    quote: str = Field(min_length=1, max_length=20000)
    created_at: Instant


class DraftCard(Contract):
    id: Id
    artifact_id: Id
    front: Text
    back: Text
    topic: Topic


class DeckDraft(Contract):
    id: Id
    session_id: Id
    title: str = Field(max_length=300)
    topic: str = Field(max_length=100)
    cards: list[DraftCard] = Field(max_length=200)
    created_at: Instant
    updated_at: Instant
    published_deck_id: Id | None = None


class QuizAttempt(Contract):
    id: Id
    quiz_id: Id
    at: Instant
    questions: list[QuizQuestion] = Field(min_length=1, max_length=200)
    answers: dict[Id, Text]


class FocusLog(Contract):
    id: Id
    title: str = Field(max_length=300)
    session_id: str = Field(max_length=100)
    started_at: Instant
    completed_at: Instant
    duration_minutes: float = Field(gt=0, allow_inf_nan=False)
    focus_seconds: float = Field(gt=0, allow_inf_nan=False)


class LearnWorkspace(Contract):
    sessions: list[Subject] = Field(default_factory=list, max_length=200)
    artifacts: list[Artifact] = Field(default_factory=list, max_length=5000)
    decks: list[Deck] = Field(default_factory=list, max_length=500)
    cards: list[Card] = Field(default_factory=list, max_length=10000)
    reviews: list[Review] = Field(default_factory=list, max_length=20000)
    materials: list[Material] = Field(default_factory=list, max_length=1000)
    highlights: list[Highlight] = Field(default_factory=list, max_length=5000)
    deck_drafts: list[DeckDraft] = Field(default_factory=list, max_length=500)
    quiz_attempts: list[QuizAttempt] = Field(default_factory=list, max_length=5000)
    focus_log: list[FocusLog] = Field(default_factory=list, max_length=20000)

    @model_validator(mode="after")
    def references_and_limits(self):
        def index(items):
            values = {item.id: item for item in items}
            if len(values) != len(items):
                raise ValueError("Duplicate IDs")
            return values

        groups = {name: index(getattr(self, name)) for name in type(self).model_fields}

        def require(condition):
            if not condition:
                raise ValueError("Invalid learning relationship or content")

        subjects, cards, decks = groups["sessions"], groups["cards"], groups["decks"]
        materials, highlights = groups["materials"], groups["highlights"]
        for item in [*self.artifacts, *self.decks, *self.materials, *self.deck_drafts]:
            require(item.session_id in subjects)
        for card in self.cards:
            require(card.deck_id in decks and card.front.strip() and card.back.strip())
            require(not card.artifact_id or card.artifact_id in groups["artifacts"])
        for h in self.highlights:
            source = materials.get(h.source_id)
            require(source and source.kind == "source" and h.end > h.start and h.quote.strip())
            # JS Range positions count UTF-16 code units, including astral characters.
            text = source.content.encode("utf-16-le")
            require(h.end * 2 <= len(text))
            require(text[h.start * 2 : h.end * 2].decode("utf-16-le") == h.quote)
        for a in self.artifacts:
            require(a.body.strip())
            require(not a.highlight_id or a.highlight_id in highlights)
        for draft in self.deck_drafts:
            index(draft.cards)
            for card in draft.cards:
                require(card.artifact_id in groups["artifacts"])
            if draft.published_deck_id:
                require(draft.published_deck_id in decks and draft.cards)
                require(all(c.front.strip() and c.back.strip() for c in draft.cards))
                require(all(c.id in cards for c in draft.cards))
        for material in self.materials:
            if material.questions is not None:
                require(material.kind == "quiz")
                index(material.questions)
                for q in material.questions:
                    require(q.front.strip() and q.back.strip())
                    require(not q.card_id or q.card_id in cards)
        for review in self.reviews:
            require(
                review.card_id in cards
                and review.deck_id in decks
                and review.session_id in subjects
            )
            require(review.previous.id == review.next.id == review.card_id)
            require(review.previous.deck_id == review.next.deck_id == review.deck_id)
        for attempt in self.quiz_attempts:
            quiz = materials.get(attempt.quiz_id)
            require(quiz and quiz.kind == "quiz")
            expected = quiz.questions or [
                QuizQuestion(id=quiz.id, front=quiz.content, back=quiz.answer or "")
            ]
            require(attempt.questions == expected)
            require(set(attempt.answers) == {q.id for q in attempt.questions})
            require(all(a.strip() for a in attempt.answers.values()))
        for log in self.focus_log:
            require(not log.session_id or log.session_id in subjects)
            require(log.completed_at >= log.started_at)
            require(log.focus_seconds == log.duration_minutes * 60)
        if len(json.dumps(self.model_dump(by_alias=True), ensure_ascii=False).encode()) > 800000:
            raise ValueError(
                "Workspace exceeds the initial 800 KB limit; export before splitting it"
            )
        return self


class WorkspaceView(Contract):
    revision: int
    workspace: LearnWorkspace


class WorkspaceSaved(Contract):
    revision: int


class WebsiteSourceInput(Contract):
    url: str = Field(min_length=1, max_length=2000)


class ExtractedSource(Contract):
    title: str
    content: str
    url: str | None = None


class SourceImportView(Contract):
    id: str
    status: Literal["queued", "processing", "ready", "failed"]
    result: ExtractedSource | None = None
    message: str | None = None
