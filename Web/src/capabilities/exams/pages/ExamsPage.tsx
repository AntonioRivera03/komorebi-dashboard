import { PageHeader } from '../../../shared/ui/PageHeader'
import { AsyncPanel } from '../../../shared/ui/AsyncPanel'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { Notice } from '../../../shared/ui/Notice'
import { useExams } from '../interfaces/useExams'
import { ExamCard } from '../components/ExamCard'

export default function ExamsPage() {
  const exams = useExams()
  return (
    <div className="k-page">
      <PageHeader eyebrow="Exams · L05" title="Exam studio" subtitle="Map syllabus coverage, practise under constraints and repair repeated mistakes. Coverage and demonstrated performance are always shown apart." />
      <div className="k-grid k-grid--sidebar">
        <AsyncPanel query={exams} isEmpty={(data) => data.length === 0} empty={<EmptyState glyph="✍" title="No exams configured">Enter a date, format, syllabus topics with weights and the approved marking material.</EmptyState>}>
          {({ data }) => (
            <div className="k-grid k-grid--cards">
              {data.map((exam) => (
                <ExamCard key={exam.id} exam={exam} />
              ))}
            </div>
          )}
        </AsyncPanel>
        <aside className="k-stack">
          <Notice glyph="✦">AI drafts questions through Study and suggests rubric-based marking, quoting the criterion it applied. A grade is only “reviewed” after you or a deterministic check confirm it. No final score is ever promised.</Notice>
          <Notice glyph="⛨">Missing rubrics allow practice but never a fabricated score. Reassessment versions results instead of overwriting history.</Notice>
        </aside>
      </div>
    </div>
  )
}
