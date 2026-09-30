import React, { useMemo, useState } from 'react';
import './COAttainment.css';

const LEVEL_MULTIPLIERS = [1, 2, 3];
const INITIAL_LEVELS = [
  { target: 90, threshold: 40 },
  { target: 70, threshold: 60 },
  { target: 50, threshold: 66 }
];

const INITIAL_ASSESSMENTS = Array.from({ length: 8 }, (_, index) => ({
  id: `ia-${index + 1}`,
  name: `A-${index + 1}`,
  co: index < 3 ? 1 : index < 6 ? 2 : 3,
  maxMarks: 10
}));

const INITIAL_STUDENTS = [
  { id: 's1', name: 'Aarav Patel', appeared: true, twMarks: 44, marks: [8, 9, 7, 8, 7, 9, 8, 8] },
  { id: 's2', name: 'Diya Shah', appeared: true, twMarks: 47, marks: [9, 9, 8, 7, 8, 8, 9, 9] },
  { id: 's3', name: 'Ishaan Kulkarni', appeared: true, twMarks: 35, marks: [6, 7, 6, 8, 6, 7, 7, 6] },
  { id: 's4', name: 'Meera Joshi', appeared: true, twMarks: 49, marks: [10, 9, 10, 9, 8, 9, 9, 10] },
  { id: 's5', name: 'Rohan Deshmukh', appeared: true, twMarks: 30, marks: [5, 6, 4, 6, 7, 5, 6, 5] },
  { id: 's6', name: 'Sana Khan', appeared: true, twMarks: 42, marks: [7, 8, 7, 9, 8, 8, 7, 8] },
  { id: 's7', name: 'Kabir Mehta', appeared: true, twMarks: 38, marks: [8, 6, 7, 7, 7, 6, 8, 7] },
  { id: 's8', name: 'Anaya Rao', appeared: false, twMarks: 0, marks: [0, 0, 0, 0, 0, 0, 0, 0] }
];

function StepHeading({ number, title, detail }) {
  return (
    <div className="att-step-heading">
      <span className="att-step-number">{String(number).padStart(2, '0')}</span>
      <div><h2>{title}</h2>{detail && <p>{detail}</p>}</div>
    </div>
  );
}

function decimal(value) {
  return Number.isFinite(value) ? value.toFixed(2) : '—';
}

function calculateAttainment(eligibleStudents, levelConfig, maxMarks, scoreForStudent) {
  if (eligibleStudents.length === 0) {
    return { eligible: 0, levels: LEVEL_MULTIPLIERS.map(() => ({ achieved: 0, percent: null, attainment: null })), final: null };
  }
  const levels = levelConfig.map((level, index) => {
    const requiredMarks = Number(maxMarks) * Number(level.threshold) / 100;
    const achieved = eligibleStudents.filter((student) => Number(scoreForStudent(student)) >= requiredMarks).length;
    const achievedPercent = achieved / eligibleStudents.length * 100;
    const target = Number(level.target);
    return {
      achieved,
      percent: achievedPercent,
      attainment: target > 0 ? achievedPercent / target * LEVEL_MULTIPLIERS[index] : null
    };
  });
  const final = levels.every((level) => Number.isFinite(level.attainment))
    ? levels.reduce((total, level) => total + level.attainment, 0) / 6
    : null;
  return { eligible: eligibleStudents.length, levels, final };
}

function average(values) {
  const available = values.filter(Number.isFinite);
  return available.length ? available.reduce((total, value) => total + value, 0) / available.length : null;
}

function LevelConfiguration({ title, detail, values, onChange, number }) {
  return (
    <section className="att-panel">
      <StepHeading number={number} title={title} detail={detail} />
      <div className="table-responsive att-table-wrap">
        <table className="att-input-table att-level-table">
          <thead><tr><th>Level</th><th>Target % students</th><th>Threshold % marks</th><th>Fixed multiplier</th></tr></thead>
          <tbody>{values.map((level, index) => (
            <tr key={index}>
              <td><strong>Level {index + 1}</strong></td>
              <td><label className="att-input-suffix"><input aria-label={`${title} level ${index + 1} target percentage`} type="number" min="0" max="100" step="0.1" value={level.target} onChange={(event) => onChange(index, 'target', event.target.value)} /><b>%</b></label></td>
              <td><label className="att-input-suffix"><input aria-label={`${title} level ${index + 1} threshold percentage`} type="number" min="0" max="100" step="0.1" value={level.threshold} onChange={(event) => onChange(index, 'threshold', event.target.value)} /><b>%</b></label></td>
              <td><input className="att-fixed-input" aria-label={`${title} level ${index + 1} fixed multiplier`} value={LEVEL_MULTIPLIERS[index]} readOnly /></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <p className="att-inline-note">Multipliers are fixed by the attainment formula and cannot be changed.</p>
    </section>
  );
}

export default function COAttainment({ isDemo = false }) {
  const [coCount, setCoCount] = useState(3);
  const [assessments, setAssessments] = useState(INITIAL_ASSESSMENTS);
  const [students, setStudents] = useState(INITIAL_STUDENTS);
  const [iaLevels, setIaLevels] = useState(INITIAL_LEVELS);
  const [twLevels, setTwLevels] = useState(INITIAL_LEVELS.map((level) => ({ ...level })));
  const [twMaxMarks, setTwMaxMarks] = useState(50);
  const [iaWeight, setIaWeight] = useState(30);
  const [twWeight, setTwWeight] = useState(70);
  const [fileName, setFileName] = useState('grade-xpert-co-demo.xlsx');

  const coNumbers = Array.from({ length: Math.max(0, Math.min(coCount, 20)) }, (_, index) => index + 1);
  const appearedStudents = students.filter((student) => student.appeared);
  const absentCount = students.length - appearedStudents.length;

  const validationIssues = useMemo(() => {
    const issues = [];
    if (!Number.isInteger(coCount) || coCount < 1 || coCount > 20) issues.push('Configure between 1 and 20 course outcomes.');
    if (assessments.length === 0) issues.push('Add at least one IA assessment.');
    for (const co of coNumbers) {
      if (!assessments.some((assessment) => Number(assessment.co) === co)) issues.push(`CO${co} must have at least one mapped IA assessment.`);
    }
    assessments.forEach((assessment) => {
      if (!assessment.name.trim()) issues.push('Every assessment needs a name.');
      if (!Number.isFinite(Number(assessment.maxMarks)) || Number(assessment.maxMarks) <= 0) issues.push(`${assessment.name || 'Assessment'} maximum marks must be greater than zero.`);
      if (!Number.isInteger(Number(assessment.co)) || Number(assessment.co) < 1 || Number(assessment.co) > coCount) issues.push(`${assessment.name || 'Assessment'} must be mapped to an existing CO.`);
    });
    if (!Number.isFinite(Number(twMaxMarks)) || Number(twMaxMarks) <= 0) issues.push('TW maximum marks must be greater than zero.');
    students.forEach((student) => {
      if (!Number.isFinite(Number(student.twMarks)) || Number(student.twMarks) < 0 || Number(student.twMarks) > Number(twMaxMarks)) issues.push(`${student.name} TW marks must be between 0 and the maximum marks.`);
      assessments.forEach((assessment, index) => {
        const mark = Number(student.marks[index]);
        if (!Number.isFinite(mark) || mark < 0) issues.push(`${student.name} marks for ${assessment.name || 'an assessment'} cannot be negative or blank.`);
        else if (mark > Number(assessment.maxMarks)) issues.push(`${student.name} marks for ${assessment.name || 'an assessment'} cannot exceed its maximum.`);
      });
    });
    [[iaLevels, 'IA'], [twLevels, 'TW']].forEach(([configuration, section]) => configuration.forEach((level, index) => {
      const target = Number(level.target);
      const threshold = Number(level.threshold);
      if (!Number.isFinite(target) || target <= 0 || target > 100) issues.push(`${section} Level ${index + 1} target must be greater than 0% and no more than 100%.`);
      if (!Number.isFinite(threshold) || threshold < 0 || threshold > 100) issues.push(`${section} Level ${index + 1} threshold must be between 0% and 100%.`);
    }));
    const weightsValid = Number.isFinite(Number(iaWeight)) && Number.isFinite(Number(twWeight)) && Number(iaWeight) >= 0 && Number(twWeight) >= 0;
    if (!weightsValid || Math.abs(Number(iaWeight) + Number(twWeight) - 100) > 0.001) issues.push('IA and TW weights must be non-negative and add up to exactly 100%.');
    return [...new Set(issues)];
  }, [assessments, coCount, coNumbers, iaLevels, iaWeight, students, twLevels, twMaxMarks, twWeight]);

  const iaAssessmentResults = useMemo(() => assessments.map((assessment, index) => ({
    ...assessment,
    result: calculateAttainment(appearedStudents, iaLevels, assessment.maxMarks, (student) => student.marks[index])
  })), [appearedStudents, assessments, iaLevels]);

  const iaCoResults = coNumbers.map((co) => {
    const mapped = iaAssessmentResults.filter((assessment) => Number(assessment.co) === co);
    return { co, assessmentCount: mapped.length, final: average(mapped.map((assessment) => assessment.result.final)) };
  });
  const twResult = calculateAttainment(appearedStudents, twLevels, twMaxMarks, (student) => student.twMarks);
  const summaryRows = iaCoResults.map((row) => ({
    ...row,
    ia: row.final,
    tw: twResult.final,
    final: row.final === null || twResult.final === null ? null : row.final * Number(iaWeight) / 100 + twResult.final * Number(twWeight) / 100
  }));
  const totalFinalAttainment = average(summaryRows.map((row) => row.final).filter((value) => Number.isFinite(value)));
  const updateAssessment = (id, property, value) => setAssessments((current) => current.map((assessment) => assessment.id === id ? { ...assessment, [property]: value } : assessment));
  const updateLevels = (section, index, property, value) => {
    const setter = section === 'IA' ? setIaLevels : setTwLevels;
    setter((current) => current.map((level, levelIndex) => levelIndex === index ? { ...level, [property]: value === '' ? '' : Number(value) } : level));
  };
  const addAssessment = () => {
    setAssessments((current) => [...current, { id: `ia-${Date.now()}`, name: `A-${current.length + 1}`, co: 1, maxMarks: 10 }]);
    setStudents((current) => current.map((student) => ({ ...student, marks: [...student.marks, 0] })));
  };
  const removeAssessment = (id) => {
    const removedIndex = assessments.findIndex((assessment) => assessment.id === id);
    setAssessments((current) => current.filter((assessment) => assessment.id !== id));
    setStudents((current) => current.map((student) => ({ ...student, marks: student.marks.filter((_, index) => index !== removedIndex) })));
  };
  const restoreDemo = () => {
    setCoCount(3);
    setAssessments(INITIAL_ASSESSMENTS);
    setStudents(INITIAL_STUDENTS);
    setIaLevels(INITIAL_LEVELS);
    setTwLevels(INITIAL_LEVELS.map((level) => ({ ...level })));
    setTwMaxMarks(50);
    setIaWeight(30);
    setTwWeight(70);
    setFileName('grade-xpert-co-demo.xlsx');
  };

  return (
    <div className="tab-pane attainment-page">
      <div className="att-page-intro">
        <div><div className="att-eyebrow">COURSE OUTCOME ANALYSIS</div><h2>CO Attainment</h2><p>Configure outcomes and assessments, then review independent IA and Term Work results.</p></div>
        <span className="att-demo-stamp">{isDemo ? 'DEMO WORKSPACE' : 'MOCK DATA'}</span>
      </div>

      <div className="att-demo-notice" role="note">
        <span className="att-notice-mark">i</span>
        <p><strong>Frontend demonstration.</strong> File selection is local only; calculations use the included sample ledger.</p>
        <button type="button" className="att-text-button" onClick={restoreDemo}>Restore sample</button>
      </div>

      <section className="att-panel">
        <StepHeading number={1} title="Assessment / File Upload" detail="Choose a ledger file for reference and set the number of course outcomes." />
        <div className="att-setup-grid">
          <label className="att-field att-file-field"><span>Student assessment ledger</span><span className="att-file-control">
            <input type="file" accept=".csv,.xlsx,.xls" onChange={(event) => setFileName(event.target.files?.[0]?.name || 'grade-xpert-co-demo.xlsx')} />
            <span className="att-file-button">Choose file</span><span className="att-file-name">{fileName}</span>
          </span><small>Selection only; no Excel or CSV parsing is performed.</small></label>
          <label className="att-field"><span>Number of COs</span><input type="number" min="1" max="20" step="1" value={coCount} onChange={(event) => setCoCount(event.target.value === '' ? 0 : Number(event.target.value))} /><small>Currently showing {coNumbers.length} configurable outcomes.</small></label>
          <div className="att-cohort-stats">
            <div><span>Total students</span><strong>{students.length}</strong></div><div><span>Appeared</span><strong>{appearedStudents.length}</strong></div><div><span>Absent</span><strong>{absentCount}</strong></div>
            <div className="att-assessment-detected"><span>Available assessments / marks</span><strong>{assessments.length} IA assessments · TW / {twMaxMarks || '—'} marks</strong><small>IA maximum marks are listed per assessment below.</small></div>
          </div>
        </div>
      </section>

      <section className="att-panel">
        <StepHeading number={2} title="CO Configuration & Assessment Mapping" detail="Each IA assessment is mapped to one outcome; the number and names of assessments are configurable." />
        <div className="att-co-chips" aria-label="Configured course outcomes">{coNumbers.map((co) => <span key={co}>CO{co}</span>)}</div>
        <div className="table-responsive att-table-wrap"><table className="att-input-table att-mapping-table">
          <thead><tr><th>IA assessment</th><th>Mapped CO</th><th>Maximum marks</th><th aria-label="Actions" /></tr></thead>
          <tbody>{assessments.length ? assessments.map((assessment) => <tr key={assessment.id}>
            <td><input aria-label="Assessment name" value={assessment.name} onChange={(event) => updateAssessment(assessment.id, 'name', event.target.value)} /></td>
            <td><select aria-label="Mapped course outcome" value={assessment.co} onChange={(event) => updateAssessment(assessment.id, 'co', Number(event.target.value))}>{coNumbers.map((co) => <option key={co} value={co}>CO{co}</option>)}</select></td>
            <td><input aria-label="Maximum marks" type="number" min="0" step="0.5" value={assessment.maxMarks} onChange={(event) => updateAssessment(assessment.id, 'maxMarks', event.target.value === '' ? '' : Number(event.target.value))} /></td>
            <td><button type="button" className="att-icon-button" aria-label={`Remove ${assessment.name}`} title="Remove assessment" onClick={() => removeAssessment(assessment.id)}>×</button></td>
          </tr>) : <tr><td colSpan="4" className="att-empty-cell">Add an IA assessment to map it to a CO.</td></tr>}</tbody>
        </table></div>
        <div className="att-panel-actions"><button type="button" className="att-secondary-button" onClick={addAssessment}>+ Add IA assessment</button></div>
      </section>

      <LevelConfiguration number={3} title="IA Level Configuration" detail="Internal Assessment targets and thresholds apply only to the mapped IA assessment marks." values={iaLevels} onChange={(index, property, value) => updateLevels('IA', index, property, value)} />
      <LevelConfiguration number={4} title="TW Level Configuration" detail="Term Work uses its own target and threshold settings, separate from IA." values={twLevels} onChange={(index, property, value) => updateLevels('TW', index, property, value)} />

      <section className="att-panel">
        <StepHeading number={5} title="Term Work Assessment" detail="TW is calculated independently for the appeared cohort and then used in each CO's weighted summary." />
        <label className="att-field att-tw-max-field"><span>TW maximum marks</span><input type="number" min="0" step="0.5" value={twMaxMarks} onChange={(event) => setTwMaxMarks(event.target.value === '' ? '' : Number(event.target.value))} /></label>
      </section>

      <section className="att-panel att-summary-panel">
        <StepHeading number={6} title="Final CO Attainment Summary" detail="Final CO values use the configured IA and TW weightage." />
        <div className="att-weight-config">
          <label className="att-field"><span>IA weight</span><span className="att-input-suffix"><input aria-label="IA weight" type="number" min="0" max="100" step="0.1" value={iaWeight} onChange={(event) => setIaWeight(event.target.value === '' ? '' : Number(event.target.value))} /><b>%</b></span></label>
          <span className="att-weight-plus">+</span>
          <label className="att-field"><span>TW weight</span><span className="att-input-suffix"><input aria-label="TW weight" type="number" min="0" max="100" step="0.1" value={twWeight} onChange={(event) => setTwWeight(event.target.value === '' ? '' : Number(event.target.value))} /><b>%</b></span></label>
          <strong className={`att-weight-total ${Number(iaWeight) + Number(twWeight) === 100 ? 'is-valid' : 'is-invalid'}`}>Total {Number(iaWeight) + Number(twWeight)}%</strong>
        </div>
        <div className="att-total-final-card">
          <span>Total Final Attainment</span>
          <strong>{decimal(totalFinalAttainment)}</strong>
        </div>
        {validationIssues.length > 0 && <div className="att-validation" role="alert"><strong>Review these items</strong><ul>{validationIssues.map((issue) => <li key={issue}>{issue}</li>)}</ul></div>}
      </section>

    </div>
  );
}