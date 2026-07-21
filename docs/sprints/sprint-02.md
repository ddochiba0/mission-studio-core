# Sprint 2 — Mission workspace

## Goal

Provide project-agnostic mission lifecycle operations and a usable Studio workspace.

## Included

- Mission repository contract
- in-memory repository adapter for development and tests
- create, list, update, and delete use cases
- immutable checkpoint add, remove, and reorder operations
- responsive Studio create/list/edit/delete interface

Persistent server storage and application-specific adapters are deliberately deferred.

## User verification

1. Create two missions and confirm both appear in the list.
2. Rename one mission and confirm the list updates.
3. Delete one mission and confirm the count decreases.
4. Resize to a mobile width and confirm inputs and buttons remain readable.
