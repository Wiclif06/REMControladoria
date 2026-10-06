export default function LoadingScreen() {
  return (
    <div className="rem-loading" role="status" aria-live="polite" aria-busy="true">
      <div className="rem-loading-content">
        <img className="rem-loading-symbol" src="/rem-dove.png" alt="" width={76} height={76}/>
        <div className="rem-loading-wordmark">REM<span>CONTROLADORIA</span></div>
        <div className="rem-loading-line" aria-hidden="true"><span/></div>
        <p>Preparando seu acesso<span aria-hidden="true">…</span></p>
      </div>
      <span className="rem-loading-footer">REM CONSTRUTORA</span>
    </div>
  );
}
