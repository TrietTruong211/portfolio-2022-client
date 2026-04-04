import React from "react";
import { About, Footer, Header, Skills, Work } from "./container";
import { Navbar, ChatWidget } from "./components";
import "./App.scss";

const App = () => {
  return (
    <div className="app">
      <Navbar />
      <Header />
      <About />
      <Work />
      <Skills />
      <Footer />
      <ChatWidget />
    </div>
  );
};

export default App;
