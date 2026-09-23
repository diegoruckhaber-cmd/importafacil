export default function NotFound() {
  return (
    <main className="productContentPage">
      <div className="productContentShell">
        <div className="productLocked" style={{ textAlign: "center" }}>
          <small className="productEyebrow">404</small>
          <h1 className="productPageTitle">Esta página não existe.</h1>
          <p className="accountIntro">
            Volte ao início ou abra uma nova simulação para continuar seu pré-estudo.
          </p>
          <div className="productPageActions" style={{ justifyContent: "center" }}>
            <a href="/" className="secondaryBtn">Página inicial</a>
            <a href="/simulacao-v2" className="primaryBtn">Nova simulação</a>
          </div>
        </div>
      </div>
    </main>
  );
}
