# AI Chat History

This directory documents significant AI-assisted development decisions and implementations.

## Structure

- Document only significant technical decisions
- Include implementation details and code examples
- Focus on reusable knowledge

## Categories

- [ARCH] Architecture decisions
- [FEAT] Feature implementations
- [BUG] Bug fixes
- [PERF] Performance optimizations

## Managing Chat Histories

When working across different machines:

### Windows Usage

/scripts/Merge-Chats.ps1

### Linux/Unix Usage

/scripts/merge-chats.sh

### Process

The scripts will:

1. Backup existing chats
2. Pull latest changes
3. Handle conflicts by preserving both versions
4. Allow manual review and combination of changes

Note: Make sure to run the appropriate script for your operating system
