import { lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { AppShell } from './AppShell'
import { NotFoundPage } from './components/NotFoundPage'

/*
 * Each route group loads independently (React.lazy) at a feature boundary.
 * Paths follow the spec's frontend organisation table.
 */
const TodayPage = lazy(() => import('../capabilities/today/pages/TodayPage'))
const CapturePage = lazy(() => import('../capabilities/capture/pages/CapturePage'))
const GoalsPage = lazy(() => import('../capabilities/goals/pages/GoalsPage'))
const GoalDetailPage = lazy(() => import('../capabilities/goals/pages/GoalDetailPage'))
const TasksPage = lazy(() => import('../capabilities/tasks/pages/TasksPage'))
const CalendarPage = lazy(() => import('../capabilities/calendar/pages/CalendarPage'))
const CalendarConnectionsPage = lazy(() => import('../capabilities/calendar/pages/CalendarConnectionsPage'))
const PlanPage = lazy(() => import('../capabilities/capacity/pages/PlanPage'))
const LibraryPage = lazy(() => import('../capabilities/knowledge/pages/LibraryPage'))
const SourcePage = lazy(() => import('../capabilities/knowledge/pages/SourcePage'))
const ArtifactsPage = lazy(() => import('../capabilities/learn/ArtifactsPage'))
const LearnHomePage = lazy(() => import('../capabilities/learn/LearnHomePage'))
const NotePage = lazy(() => import('../capabilities/knowledge/pages/NotePage'))
const SearchPage = lazy(() => import('../capabilities/knowledge/pages/SearchPage'))
const SessionsPage = lazy(() => import('../capabilities/learn/SessionsPage'))
const SubjectPage = lazy(() => import('../capabilities/learn/SessionPage'))
const SessionPage = lazy(() => import('../capabilities/study/pages/SessionPage'))
const ResumePage = lazy(() => import('../capabilities/study/pages/ResumePage'))
const ReviewPage = lazy(() => import('../capabilities/learn/ReviewPage'))
const ExamsPage = lazy(() => import('../capabilities/exams/pages/ExamsPage'))
const ExamPage = lazy(() => import('../capabilities/exams/pages/ExamPage'))
const ConnectionsPage = lazy(() => import('../capabilities/connections/pages/ConnectionsPage'))
const HomePage = lazy(() => import('../capabilities/home/pages/HomePage'))
const HomeConnectionsPage = lazy(() => import('../capabilities/home/pages/HomeConnectionsPage'))
const ScenesPage = lazy(() => import('../capabilities/home/pages/ScenesPage'))
const AlertsPage = lazy(() => import('../capabilities/homeAlerts/pages/AlertsPage'))
const TrainingPage = lazy(() => import('../capabilities/training/pages/TrainingPage'))
const HabitsPage = lazy(() => import('../capabilities/habits/pages/HabitsPage'))
const ReflectionPage = lazy(() => import('../capabilities/reflection/pages/ReflectionPage'))
const PeoplePage = lazy(() => import('../capabilities/relationships/pages/PeoplePage'))
const HouseholdPage = lazy(() => import('../capabilities/household/pages/HouseholdPage'))
const FinancePage = lazy(() => import('../capabilities/finance/pages/FinancePage'))
const BriefingPage = lazy(() => import('../capabilities/briefings/pages/BriefingPage'))
const BriefingSourcesPage = lazy(() => import('../capabilities/briefings/pages/BriefingSourcesPage'))
const AssistantPage = lazy(() => import('../capabilities/assistant/pages/AssistantPage'))
const VoicePage = lazy(() => import('../capabilities/voice/pages/VoicePage'))
const AutomationsPage = lazy(() => import('../capabilities/automation/pages/AutomationsPage'))
const UsagePage = lazy(() => import('../capabilities/usage/pages/UsagePage'))
const ConversationsPage = lazy(() => import('../capabilities/conversations/pages/ConversationsPage'))
const MemoryPage = lazy(() => import('../capabilities/memory/pages/MemoryPage'))
const ImprovementsPage = lazy(() => import('../capabilities/evolution/pages/ImprovementsPage'))
const SettingsPage = lazy(() => import('./settings/SettingsPage'))

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/today" replace />} />
        <Route path="today" element={<TodayPage />} />
        <Route path="capture" element={<CapturePage />} />
        <Route path="capture/:id" element={<CapturePage />} />
        <Route path="goals" element={<GoalsPage />} />
        <Route path="goals/:id" element={<GoalDetailPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="tasks/:id" element={<TasksPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="calendar/connections" element={<CalendarConnectionsPage />} />
        <Route path="plan" element={<PlanPage />} />
        <Route path="learn">
          <Route index element={<LearnHomePage />} />
          <Route path="artifacts" element={<ArtifactsPage />} />
          <Route path="library" element={<LibraryPage />} />
          <Route path="library/search" element={<SearchPage />} />
          <Route path="library/:sourceId" element={<SourcePage />} />
          <Route path="notes" element={<Navigate to="/learn/artifacts" replace />} />
          <Route path="notes/:id" element={<NotePage />} />
          <Route path="sessions" element={<SessionsPage />} />
          <Route path="sessions/:id" element={<SubjectPage />} />
          <Route path="practice/:id" element={<SessionPage />} />
          <Route path="resume" element={<ResumePage />} />
          <Route path="review" element={<ReviewPage />} />
          <Route path="exams" element={<ExamsPage />} />
          <Route path="exams/:id" element={<ExamPage />} />
          <Route path="japanese" element={<Navigate to="/learn/sessions/japanese" replace />} />
          <Route path="japanese/skills/:id" element={<Navigate to="/learn/sessions/japanese" replace />} />
          <Route path="connections" element={<ConnectionsPage />} />
        </Route>
        <Route path="home">
          <Route index element={<HomePage />} />
          <Route path="rooms/:id" element={<HomePage />} />
          <Route path="connections" element={<HomeConnectionsPage />} />
          <Route path="scenes" element={<ScenesPage />} />
          <Route path="scenes/:id" element={<ScenesPage />} />
          <Route path="alerts" element={<AlertsPage />} />
        </Route>
        <Route path="life">
          <Route index element={<Navigate to="/life/household" replace />} />
          <Route path="training" element={<TrainingPage />} />
          <Route path="training/plans/:id" element={<TrainingPage />} />
          <Route path="habits" element={<HabitsPage />} />
          <Route path="review" element={<ReflectionPage />} />
          <Route path="people" element={<PeoplePage />} />
          <Route path="household" element={<HouseholdPage />} />
          <Route path="household/:tab" element={<HouseholdPage />} />
          <Route path="finance" element={<FinancePage />} />
        </Route>
        <Route path="briefing" element={<BriefingPage />} />
        <Route path="briefing/sources" element={<BriefingSourcesPage />} />
        <Route path="assistant" element={<AssistantPage />} />
        <Route path="voice" element={<VoicePage />} />
        <Route path="automations" element={<AutomationsPage />} />
        <Route path="automations/:id" element={<AutomationsPage />} />
        <Route path="automations/runs/:runId" element={<AutomationsPage />} />
        <Route path="history">
          <Route index element={<Navigate to="/history/usage" replace />} />
          <Route path="usage" element={<UsagePage />} />
        </Route>
        <Route path="conversations" element={<ConversationsPage />} />
        <Route path="conversations/:id" element={<ConversationsPage />} />
        <Route path="memory" element={<MemoryPage />} />
        <Route path="improvements" element={<ImprovementsPage />} />
        <Route path="improvements/:id" element={<ImprovementsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
