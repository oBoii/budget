from abc import ABC, abstractmethod


class AbstractModel(ABC):

    @abstractmethod
    def serialize(self) -> dict:
        pass
