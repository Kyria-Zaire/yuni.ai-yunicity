import type { NextPageContext } from "next";

type Props = { statusCode?: number };

/**
 * Sans hooks React — évite les erreurs de prérendu (useContext null) sur /404 et /500.
 */
export default function PagesError({ statusCode }: Props) {
  return (
    <div style={{ fontFamily: "system-ui", padding: "2rem" }}>
      <h1 style={{ fontSize: "1.25rem" }}>
        {statusCode === 404
          ? "Page introuvable"
          : statusCode
            ? `Erreur ${statusCode}`
            : "Erreur"}
      </h1>
    </div>
  );
}

PagesError.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};
