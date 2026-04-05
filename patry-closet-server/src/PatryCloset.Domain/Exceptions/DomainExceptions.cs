namespace PatryCloset.Domain.Exceptions;

public class DomainException(string message) : Exception(message);

public class NotFoundException(string entityName, object key)
    : DomainException($"Entity \"{entityName}\" ({key}) was not found.");

public class InsufficientStockException(string sku, int requested, int available)
    : DomainException($"Insufficient stock for SKU {sku}: requested {requested}, available {available}.")
{
    public string Sku { get; } = sku;
    public int Requested { get; } = requested;
    public int Available { get; } = available;
}

public class InvalidOrderStateException(string message) : DomainException(message);
