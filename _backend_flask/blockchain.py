import hashlib
import json
from datetime import datetime


class Block:
    """Represent one block in the blockchain."""

    def __init__(self, index, timestamp, data, previous_hash):
        # Store the block details.
        self.index = index
        self.timestamp = timestamp
        self.data = data
        self.previous_hash = previous_hash

        # Generate the block hash after all block data is set.
        self.hash = self.calculate_hash()

    def calculate_hash(self):
        """Create a SHA-256 hash from the block contents."""
        block_data = {
            "index": self.index,
            "timestamp": self.timestamp,
            "data": self.data,
            "previous_hash": self.previous_hash,
        }

        # Convert the block data into a stable JSON string before hashing.
        block_string = json.dumps(block_data, sort_keys=True)
        return hashlib.sha256(block_string.encode()).hexdigest()

    def to_dict(self):
        """Convert the block into a dictionary."""
        return {
            "index": self.index,
            "timestamp": self.timestamp,
            "data": self.data,
            "previous_hash": self.previous_hash,
            "hash": self.hash,
        }


class Blockchain:
    """Manage a simple chain of linked blocks."""

    def __init__(self):
        # Store all blocks in this list.
        self.chain = []
        self.create_genesis_block()

    def create_genesis_block(self):
        """Create the first block in the chain."""
        genesis_block = Block(
            index=0,
            timestamp=datetime.now().isoformat(),
            data={"message": "Genesis block"},
            previous_hash="0",
        )
        self.chain.append(genesis_block)

    def add_block(self, data):
        """Add a new block linked to the previous block."""
        previous_block = self.chain[-1]

        new_block = Block(
            index=len(self.chain),
            timestamp=datetime.now().isoformat(),
            data=data,
            previous_hash=previous_block.hash,
        )

        self.chain.append(new_block)
        return new_block

    def to_list(self):
        """Convert the full blockchain into a list of dictionaries."""
        return [block.to_dict() for block in self.chain]
