<script lang="ts">
  export let label = 'Clear';
</script>

<button
  type="button"
  class="clear-btn"
  on:click
  aria-label={label}
>
  <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
    <path
      fill="currentColor"
      d="M4.22 4.22a.75.75 0 0 1 1.06 0L8 6.94l2.72-2.72a.75.75 0 1 1 1.06 1.06L9.06 8l2.72 2.72a.75.75 0 1 1-1.06 1.06L8 9.06l-2.72 2.72a.75.75 0 0 1-1.06-1.06L6.94 8 4.22 5.28a.75.75 0 0 1 0-1.06Z"
    />
  </svg>
</button>

<style>
  .clear-btn {
    position: absolute;
    right: var(--space-2);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-1);
    border: none;
    background: transparent;
    color: var(--color-text-muted);
    cursor: pointer;
    transition: color var(--duration-fast) var(--ease-standard);
  }

  .clear-btn:hover {
    color: var(--color-accent);
  }

  .clear-btn:focus-visible {
    outline: 2px solid var(--color-focus-ring);
    outline-offset: 2px;
  }
</style>
