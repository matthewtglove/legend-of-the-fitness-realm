# todo

-   [x] {1 hour} setup workflow inside lofr project and load lofr code as a workflow
    -   [x] {5 mins} create the packages/workflow-server (bun) copy workflow-server from 3d-scene project
    -   [x] {5 mins} add react-flow to lofr
    -   [x] {5 mins} create empty workflow-editor folder in lofr-app/src/workflow/workflow-editor
    -   [x] {5 mins} open workflow-editor with empty react-flow
    -   [x] {5 mins} define hard coded lofr-workflow-loader that generates a workflow with hard coded nodes (prototype for workflow-as-code definition)
    -   [x] {5 mins} serve raw text files with the workflow-server
    -   [x] {10 mins} make a node to display raw text file from workflow-server (input relative path)
    -   [x] {10 mins} make a node to run a string function and display results from workflow-server (input relative path, function name)
    -   [x] {10 mins} make a node to display rendered js react component from workflow-server (input relative path, function name)
-   [ ] {1 hour} connected nodes
    -   [x] {5 mins} plan hour
    -   [x] {5 mins} define observable
    -   [x] {5 mins} define component registry
    -   [x] {5 mins} register existing node types
    -   [x] {5 mins} create inputs
    -   [x] {5 mins} create outputs
    -   [] {5 mins} name outputs
    -   [] {5 mins} connect some nodes
    -   [] {5 mins} add text startAtLine and endAtLine
    -   [] {5 mins} create generateWorkflow
    -   [] {5 mins} create generateWorkflow preview node
    -   [] {5 mins} plan next hour
-   [ ] {1 hour} complete MiniGame_NightPrep as LofrMiniGame
    -   [] {5 mins} plan 1st hour
    -   [] {5 mins} plan 2nd hour
    -   [] {5 mins} create placeholder systems
    -   [] {5 mins} create MiniGame_NightPrep as LofrMiniGame component
    -   [] {5 mins} create LofrMiniGame registry
    -   [] {5 mins} register MiniGame_NightPrep
-   [ ] {1 hour} complete MiniGame_MorningRise as LofrMiniGame

# ideas

-   ai-node: call an ai to modify code for a component
-   component-node-inputs: define inputs for the component node to allow sending the component props
-   string-builder: build a string using a template (for prompt building)
-   spread-sheet-node: support spreadsheet nodes for data processing
