export function BrokerMark({ broker, large = false }) {
  return (
    <span className={`broker-mark broker-mark-${broker.color}${large ? ' broker-mark-large' : ''}`} aria-hidden="true">
      {broker.initials}
    </span>
  )
}
