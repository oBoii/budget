from models.abstract_model import AbstractModel


class SavingsPair(AbstractModel):
    def __init__(self, value: float, target: float) -> None:
        self.value = value
        self.target = target

    def serialize(self) -> dict:
        return {
            "value": self.value,
            "target": self.target
        }
