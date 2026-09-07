using MyJobBoard.Domain.Enums;

namespace MyJobBoard.Domain.Common;

public class RangeValue
{
    public double Min { get; set; }
    public double? Max { get; set; }
}

public class SalaryRange : RangeValue
{
    public Periodicity Periodicity { get; set; }
}
