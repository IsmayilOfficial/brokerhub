import { ArrowLeft, ArrowRight, BadgeCheck, RotateCcw, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { BrokerMark } from '../components/BrokerMark.jsx'
import { brokers } from '../data/brokers.js'
import { useCompare } from '../context/useCompare.js'

const quizSteps = [
  { key: 'experience', title: 'How experienced are you?', choices: ['Beginner', 'Intermediate', 'Advanced'] },
  { key: 'budget', title: 'What is your starting budget?', choices: ['Under $500', '$500–5,000', '$5,000+'] },
  { key: 'asset', title: 'What would you like to trade?', choices: ['Stocks', 'ETF', 'Forex', 'Crypto', 'Mixed'] },
  { key: 'country', title: 'Where are you based?', choices: ['Azerbaijan', 'Turkey', 'UAE', 'USA', 'UK', 'Other'] },
  { key: 'swapFree', title: 'Do you need Islamic / swap-free conditions?', choices: ['Yes', 'No'] },
]

const quizAssetTypes = {
  Stocks: ['Stocks', 'Shares'],
  ETF: ['ETF', 'ETFs', 'Stocks', 'Shares'],
  Forex: ['Forex'],
  Crypto: ['Crypto', 'Cryptocurrency'],
}

function supportsAsset(broker, asset) {
  if (asset === 'Mixed') {
    return Object.values(quizAssetTypes).filter((types) =>
      types.some((type) => broker.markets.includes(type)),
    ).length >= 2
  }
  return (quizAssetTypes[asset] || []).some((type) => broker.markets.includes(type))
}

function brokerMatchScore(broker) {
  return broker.trustScore * 0.35
    + broker.feeScore * 0.25
    + broker.marketsScore * 0.2
    + broker.supportScore * 0.1
    + broker.platformsScore * 0.1
}

function recommendationsFor(answers) {
  return brokers
    .filter((broker) => broker.supportedCountries.includes(answers.country))
    .filter((broker) => answers.swapFree !== 'Yes' || broker.supportsSwapFree)
    .filter((broker) => supportsAsset(broker, answers.asset))
    .filter((broker) => answers.budget !== 'Under $500' || broker.minDeposit <= 500)
    .filter((broker) => answers.budget !== '$500–5,000' || broker.minDeposit <= 5000)
    .map((broker) => ({ broker, score: brokerMatchScore(broker) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
}

export function QuizPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { replaceCompare } = useCompare()
  const queryAsset = searchParams.get('asset')
  const prefilledAsset = quizSteps[2].choices.includes(queryAsset) ? queryAsset : null
  const sourceTicker = searchParams.get('prefill')
  const [answers, setAnswers] = useState(() => prefilledAsset ? { asset: prefilledAsset } : {})
  const [stepIndex, setStepIndex] = useState(0)
  const [showResults, setShowResults] = useState(false)
  const step = quizSteps[stepIndex]
  const recommendationResults = useMemo(() => recommendationsFor(answers), [answers])

  function chooseAnswer(value) {
    setAnswers((current) => ({ ...current, [step.key]: value }))
  }

  function showRecommendations() {
    window.localStorage.setItem('brokerhub-quiz-result', JSON.stringify({
      answers,
      brokerIds: recommendationResults.map(({ broker }) => broker.id),
      savedAt: new Date().toISOString(),
    }))
    setShowResults(true)
  }

  function compareRecommendations() {
    replaceCompare(recommendationResults.map(({ broker }) => broker.id))
    navigate('/compare')
  }

  function restartQuiz() {
    setAnswers(prefilledAsset ? { asset: prefilledAsset } : {})
    setStepIndex(0)
    setShowResults(false)
  }

  return (
    <section className="page-section terminal-page quiz-page">
      <div className="terminal-container quiz-container">
        <div className="terminal-page-heading">
          <span className="terminal-kicker"><Sparkles size={14} /> BROKERHUB / FIND MY BROKER</span>
          <h1>A broker shortlist,<br />built around you.</h1>
          <p>Answer five quick questions. Your matches are research starting points, not endorsements.</p>
        </div>
        {sourceTicker && prefilledAsset && <p className="quiz-source-note"><BadgeCheck size={14} /> You came from {sourceTicker} on Live. {prefilledAsset} is preselected for your asset preference.</p>}

        {!showResults ? (
          <div className="terminal-panel quiz-panel">
            <div className="quiz-progress-copy"><span>STEP {stepIndex + 1} <span className="terminal-dim">/ {quizSteps.length}</span></span><span>{Math.round(((stepIndex + 1) / quizSteps.length) * 100)}% COMPLETE</span></div>
            <div aria-label={`Step ${stepIndex + 1} of ${quizSteps.length}`} className="quiz-progress-track"><span style={{ width: `${((stepIndex + 1) / quizSteps.length) * 100}%` }} /></div>
            <h2>{step.title}</h2>
            <div className={`quiz-choices${step.key === 'country' ? ' quiz-country-choices' : ''}`}>
              {step.choices.map((choice) => (
                <button
                  aria-pressed={answers[step.key] === choice}
                  className={`quiz-choice${answers[step.key] === choice ? ' is-active' : ''}`}
                  key={choice}
                  onClick={() => chooseAnswer(choice)}
                  type="button"
                >
                  <span className="quiz-choice-indicator" />{choice}
                </button>
              ))}
            </div>
            <div className="quiz-actions">
              <button className="terminal-button terminal-button-quiet" disabled={stepIndex === 0} onClick={() => setStepIndex(stepIndex - 1)} type="button"><ArrowLeft size={15} /> BACK</button>
              {stepIndex < quizSteps.length - 1 ? (
                <button className="terminal-button" disabled={!answers[step.key]} onClick={() => setStepIndex(stepIndex + 1)} type="button">NEXT <ArrowRight size={15} /></button>
              ) : (
                <button className="terminal-button" disabled={!answers[step.key]} onClick={showRecommendations} type="button">SHOW MY MATCHES <ArrowRight size={15} /></button>
              )}
            </div>
            {step.key === 'budget' && <p className="terminal-footnote">Budget bands are compared against the illustrative USD minimum-deposit data.</p>}
          </div>
        ) : (
          <div className="quiz-results">
            <div className="quiz-result-heading"><div><span className="terminal-kicker">YOUR RESEARCH SHORTLIST</span><h2>{recommendationResults.length ? 'Two places to start.' : 'No matches in this sample.'}</h2></div><button className="terminal-button terminal-button-quiet" onClick={restartQuiz} type="button"><RotateCcw size={14} /> RETAKE</button></div>
            {!recommendationResults.length ? (
              <div className="terminal-panel quiz-empty">
                <p>No sample brokers match every selected country, asset, and swap-free preference. Try changing an answer or verify availability directly with a provider.</p>
                <button className="terminal-button" onClick={restartQuiz} type="button">REVIEW ANSWERS <ArrowRight size={15} /></button>
              </div>
            ) : (
              <>
                <div className="quiz-match-grid">
                  {recommendationResults.map(({ broker, score }, index) => (
                    <article className="terminal-panel quiz-match-card" key={broker.id}>
                      <div className="quiz-match-top"><span className="terminal-kicker">MATCH #{index + 1}</span><span className="quiz-match-score">{score.toFixed(1)}<small> / 100</small></span></div>
                      <div className="quiz-broker-identity"><BrokerMark broker={broker} /><div><h3>{broker.name}</h3><span>{broker.markets.join(' · ')}</span></div></div>
                      <h4>WHY THIS FITS YOU</h4>
                      <ul>
                        <li>{broker.trustScore}/100 trust score contributes 35% of the match.</li>
                        <li>{answers.asset} coverage and the 20% markets score are included.</li>
                        <li>Sample minimum deposit: {broker.minDeposit === 0 ? 'no minimum' : `$${broker.minDeposit}`}.</li>
                        <li>{answers.country} is listed in this sample&apos;s supported-country data{answers.swapFree === 'Yes' ? ' and the sample marks swap-free support' : ''}.</li>
                      </ul>
                      <button className="terminal-button terminal-button-full" onClick={() => navigate(`/brokers/${broker.slug}`)} type="button">VIEW BROKER <ArrowRight size={14} /></button>
                    </article>
                  ))}
                </div>
                <div className="quiz-result-actions">
                  {recommendationResults.length === 2 && <button className="terminal-button" onClick={compareRecommendations} type="button">COMPARE BOTH <ArrowRight size={15} /></button>}
                  <button className="terminal-button terminal-button-quiet" onClick={restartQuiz} type="button"><RotateCcw size={14} /> RETAKE QUIZ</button>
                </div>
              </>
            )}
            <p className="terminal-disclaimer">Matches use the sample broker data and weighted formula (trust 35%, fees 25%, markets 20%, support 10%, platforms 10%). Availability and account conditions are not verified; confirm directly with each broker.</p>
          </div>
        )}
      </div>
    </section>
  )
}
