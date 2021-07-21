// This triple-slash directive is needed to use the DOM.
/// <reference lib="dom"/>

import { Component, h, React } from "./deps/nanojsx.ts";
import { render } from "./mod.ts";

// Reload the page whenever a WebSocket message is received.
new WebSocket("ws://localhost:1234")
  .addEventListener("message", () => window.location.reload());

// TODO(surv): Make your own components.
class LikeButton extends Component {
  private count = 0;

  private handleClick() {
    this.count++;
    this.update();
  }

  render() {
    return (
      <section>
        <button
          onClick={() => this.handleClick()}
        >
          I like it!
        </button>
        <p>
          You liked this website <b>{this.count}</b> times.
        </p>
      </section>
    );
  }
}

// TODO(surv): Add custom UI logic.
React.render(
  <main>
    <h1>{render()}</h1>
    <LikeButton />
  </main>,
  document.body,
);
