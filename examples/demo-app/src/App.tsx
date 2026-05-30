import "./App.css";
import { Masthead } from "./components/Masthead";
import { Hero } from "./components/Hero";
import { Workflow } from "./components/Workflow";
import { Features } from "./components/Features";
import { Safety } from "./components/Safety";
import { Playground } from "./components/Playground";
import { Footer } from "./components/Footer";

export function App() {
  return (
    <div className="page">
      <div className="grain" aria-hidden />
      <Masthead />
      <main>
        <Hero />
        <Workflow />
        <Features />
        <Safety />
        <Playground />
      </main>
      <Footer />
    </div>
  );
}
