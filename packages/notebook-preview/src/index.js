/* @flow */
import React from "react";
import { List as ImmutableList, Map as ImmutableMap } from "immutable";

import { Display } from "@nteract/display-area";
import { displayOrder, transforms } from "@nteract/transforms";

import {
  emptyNotebook,
  appendCellToNotebook,
  fromJS,
  createCodeCell
} from "@nteract/commutable";

import {
  themes,
  Cell,
  Input,
  Prompt,
  PromptBuffer,
  Source,
  Outputs,
  Cells
} from "@nteract/core";

import { PapermillView } from "./papermill";

import Markdown from "@nteract/markdown";
import MathJax from "@nteract/mathjax";

type Props = {
  displayOrder: Array<string>,
  notebook: any,
  transforms: Object,
  theme: "light" | "dark"
};

type State = {
  notebook: any
};

export class NotebookPreview extends React.PureComponent<Props, State> {
  static defaultProps = {
    displayOrder,
    transforms,
    notebook: appendCellToNotebook(
      emptyNotebook,
      createCodeCell().set("source", "# where's the content?")
    ),
    theme: "light"
  };

  constructor(props: Props) {
    super(props);

    this.state = {
      notebook: fromJS(props.notebook)
    };
  }

  componentWillReceiveProps(nextProps: Props) {
    if (nextProps.notebook !== this.props.notebook) {
      this.setState({ notebook: fromJS(nextProps.notebook) });
    }
  }

  render(): ?React$Element<any> {
    // TODO: Rely on setState to convert notebook from plain JS to commutable format

    const notebook = this.state.notebook;

    // Propagated from the hide_(all)_input nbextension
    const allSourceHidden = notebook.getIn(["metadata", "hide_input"], false);

    const language = notebook.getIn(
      ["metadata", "language_info", "codemirror_mode", "name"],
      notebook.getIn(
        ["metadata", "language_info", "codemirror_mode"],
        notebook.getIn(["metadata", "language_info", "name"], "text")
      )
    );

    const cellOrder = notebook.get("cellOrder");
    const cellMap = notebook.get("cellMap");

    return (
      <MathJax.Context>
        <div className="notebook-preview">
          <Cells>
            {cellOrder.map(cellID => {
              const cell = cellMap.get(cellID);
              const cellType = cell.get("cell_type");
              const source = cell.get("source");

              switch (cellType) {
                case "code":
                  const sourceHidden =
                    allSourceHidden ||
                    cell.getIn(["metadata", "inputHidden"]) ||
                    cell.getIn(["metadata", "hide_input"]);

                  const outputHidden =
                    cell.get("outputs").size === 0 ||
                    cell.getIn(["metadata", "outputHidden"]);

                  return (
                    <Cell key={cellID}>
                      <PapermillView
                        {...cell
                          .getIn(["metadata", "papermill"], ImmutableMap())
                          .toJS()}
                      />
                      <Input hidden={sourceHidden}>
                        <Prompt />
                        <Source language={language} theme={this.props.theme}>
                          {source}
                        </Source>
                      </Input>
                      <Outputs
                        hidden={outputHidden}
                        expanded={cell.getIn(
                          ["metadata", "outputExpanded"],
                          true
                        )}
                      >
                        <Display
                          outputs={cell.get("outputs").toJS()}
                          transforms={transforms}
                          displayOrder={displayOrder}
                        />
                      </Outputs>
                    </Cell>
                  );
                case "markdown":
                  return (
                    <Cell key={cellID}>
                      <div className="content-margin">
                        <Markdown source={source} />
                      </div>
                      <style jsx>{`
                        .content-margin {
                          padding-left: calc(var(--prompt-width, 50px) + 10px);
                          padding-top: 10px;
                          padding-bottom: 10px;
                          padding-right: 10px;
                        }
                      `}</style>
                    </Cell>
                  );
                case "raw":
                  return (
                    <Cell key={cellID}>
                      <pre className="raw-cell">
                        {source}
                        <style jsx>{`
                          raw-cell {
                            background: repeating-linear-gradient(
                              -45deg,
                              transparent,
                              transparent 10px,
                              #efefef 10px,
                              #f1f1f1 20px
                            );
                          }
                        `}</style>
                      </pre>
                    </Cell>
                  );

                default:
                  return (
                    <Cell key={cellID}>
                      <Outputs>
                        <pre
                        >{`Cell Type "${cellType}" is not implemented`}</pre>
                      </Outputs>
                    </Cell>
                  );
              }
            })}
          </Cells>
          <style>{`:root {
          ${themes[this.props.theme]}
            --theme-cell-shadow-hover: none;
            --theme-cell-shadow-focus: none;
            --theme-cell-prompt-bg-hover: var(--theme-cell-prompt-bg);
            --theme-cell-prompt-bg-focus: var(--theme-cell-prompt-bg);
            --theme-cell-prompt-fg-hover: var(--theme-cell-prompt-fg);
            --theme-cell-prompt-fg-focus: var(--theme-cell-prompt-fg);
          }
        `}</style>
        </div>
      </MathJax.Context>
    );
  }
}

export default NotebookPreview;
